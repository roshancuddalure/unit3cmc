import type { AuthenticatedUser } from "../../shared/types/domain";
import { HttpError } from "../../shared/http-error";
import { hasPermission } from "../../shared/permissions";
import { AuditRepository } from "../audit/repository";
import { DocumentsRepository, type DocumentListFilters } from "./repository";
import type { ObjectStorage } from "./storage";

function normalizeStatus(action?: string): string {
  if (action === "submit_review") {
    return "in_review";
  }

  if (action === "publish") {
    return "published";
  }

  return "draft";
}

export class DocumentsService {
  constructor(
    private readonly documentsRepository: DocumentsRepository,
    private readonly auditRepository: AuditRepository,
    private readonly objectStorage: ObjectStorage
  ) {}

  async list(user: AuthenticatedUser, filters: DocumentListFilters) {
    const canCompose = hasPermission(user.role, "documents:write");
    const canReview = hasPermission(user.role, "documents:review");
    const canPublish = user.role === "super_admin";

    const effectiveFilters =
      canCompose || canReview
        ? filters
        : {
            ...filters,
            status: "published"
          };

    const [documents, categories] = await Promise.all([
      this.documentsRepository.list(user.unitId, effectiveFilters),
      this.documentsRepository.listCategories(user.unitId)
    ]);

    return {
      title: "SOP Library",
      documents,
      categories,
      filters: effectiveFilters,
      canCompose,
      canReview,
      canPublish
    };
  }

  async detail(user: AuthenticatedUser, documentId: string) {
    const [document, versions, reviewEvents] = await Promise.all([
      this.documentsRepository.getById(documentId),
      this.documentsRepository.listVersions(documentId),
      this.documentsRepository.listReviewEvents(documentId)
    ]);

    const canManage = hasPermission(user.role, "documents:write");
    const canReview = hasPermission(user.role, "documents:review");
    const canPublish = user.role === "super_admin";

    if (!document) {
      return {
        title: "SOP Detail",
        document: null,
        currentVersion: null,
        versions: [],
        reviewEvents: [],
        canManage,
        canReview,
        canPublish
      };
    }

    if (document.status !== "published" && !canManage && !canReview) {
      throw new HttpError(403, "This SOP is not available for general viewing yet.");
    }

    return {
      title: "SOP Detail",
      document,
      currentVersion: versions[0] ?? null,
      versions,
      reviewEvents,
      canManage,
      canReview,
      canPublish
    };
  }

  async createSop(
    user: AuthenticatedUser,
    input: {
      title: string;
      subtitle?: string;
      category: string;
      scopeArea?: string;
      visibility: string;
      effectiveDate?: string;
      reviewDueDate?: string;
      versionNotes: string;
      changeSummary: string;
      contentHtml: string;
      action?: string;
      file?: Express.Multer.File;
    }
  ): Promise<void> {
    const status = normalizeStatus(input.action);
    const uploadResult = input.file
      ? await this.objectStorage.upload(input.file)
      : { key: "inline-editor", originalName: "inline-composer" };

    const documentId = await this.documentsRepository.createInitialVersion({
      unitId: user.unitId,
      authorUserId: user.id,
      title: input.title,
      subtitle: input.subtitle,
      category: input.category,
      scopeArea: input.scopeArea,
      visibility: input.visibility,
      effectiveDate: input.effectiveDate,
      reviewDueDate: input.reviewDueDate,
      versionNotes: input.versionNotes,
      changeSummary: input.changeSummary,
      contentHtml: input.contentHtml,
      storageKey: uploadResult.key,
      originalFileName: uploadResult.originalName,
      status
    });

    if (status === "in_review") {
      await this.documentsRepository.addReviewEvent({
        documentId,
        actorUserId: user.id,
        decision: "submitted_for_review",
        comments: input.changeSummary || input.versionNotes
      });
    }

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "documents.sop_created",
      entityType: "document",
      entityId: documentId,
      metadata: {
        title: input.title,
        category: input.category,
        status
      }
    });
  }

  async appendVersion(
    user: AuthenticatedUser,
    input: {
      documentId: string;
      versionNotes: string;
      changeSummary: string;
      contentHtml: string;
      action?: string;
      file?: Express.Multer.File;
    }
  ): Promise<void> {
    const status = normalizeStatus(input.action);
    const uploadResult = input.file
      ? await this.objectStorage.upload(input.file)
      : { key: "inline-editor", originalName: "inline-composer" };

    const versionId = await this.documentsRepository.appendVersion({
      documentId: input.documentId,
      authorUserId: user.id,
      versionNotes: input.versionNotes,
      changeSummary: input.changeSummary,
      contentHtml: input.contentHtml,
      storageKey: uploadResult.key,
      originalFileName: uploadResult.originalName,
      status
    });

    if (status === "in_review") {
      await this.documentsRepository.addReviewEvent({
        documentId: input.documentId,
        versionId,
        actorUserId: user.id,
        decision: "submitted_for_review",
        comments: input.changeSummary || input.versionNotes
      });
    }

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "documents.sop_version_appended",
      entityType: "document",
      entityId: input.documentId,
      metadata: {
        status
      }
    });
  }

  async reviewDecision(
    user: AuthenticatedUser,
    input: {
      documentId: string;
      decision: "changes_requested" | "approved" | "published" | "archived";
      comments: string;
    }
  ): Promise<void> {
    await this.documentsRepository.updateStatus(input.documentId, input.decision);
    await this.documentsRepository.addReviewEvent({
      documentId: input.documentId,
      actorUserId: user.id,
      decision: input.decision,
      comments: input.comments
    });

    await this.auditRepository.record({
      actorUserId: user.id,
      action: `documents.${input.decision}`,
      entityType: "document",
      entityId: input.documentId,
      metadata: { comments: input.comments }
    });
  }
}
