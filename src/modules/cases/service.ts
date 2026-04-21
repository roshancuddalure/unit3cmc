import type { AuthenticatedUser } from "../../shared/types/domain";
import { HttpError } from "../../shared/http-error";
import { AuditRepository } from "../audit/repository";
import { CasesRepository, type CaseListFilters } from "./repository";

const caseEntryOptions = {
  specialtyAreas: [
    "general_surgery",
    "obstetrics_gynaecology",
    "orthopaedics",
    "neurosurgery",
    "ent",
    "paediatrics",
    "icu",
    "trauma",
    "pain_service",
    "other"
  ],
  anaesthesiaTechniques: [
    "general_anaesthesia",
    "regional_anaesthesia",
    "spinal",
    "epidural",
    "sedation",
    "monitored_anaesthesia_care",
    "airway_management",
    "icu_procedure",
    "other"
  ],
  urgencies: ["elective", "urgent", "emergency"],
  patientAgeBands: ["neonate", "infant", "child", "adult", "older_adult", "not_recorded"],
  complexityLevels: ["routine", "intermediate", "complex", "critical_event"],
  settings: ["operating_theatre", "labour_room", "icu", "emergency_room", "procedure_room", "ward", "other"]
} as const;

function isGlobalCaseReviewer(user: AuthenticatedUser, hasGrant: boolean): boolean {
  return user.role === "super_admin" || user.role === "unit_admin_or_faculty" || hasGrant;
}

function isFinalCaseApprover(user: AuthenticatedUser): boolean {
  return user.role === "super_admin" || user.role === "unit_admin_or_faculty";
}

export class CasesService {
  constructor(
    private readonly casesRepository: CasesRepository,
    private readonly auditRepository: AuditRepository
  ) {}

  async list(
    user: AuthenticatedUser,
    filters: CaseListFilters = {}
  ) {
    const normalizedFilters = {
      search: filters.search?.trim() || "",
      specialtyArea: filters.specialtyArea?.trim() || "",
      anaesthesiaTechnique: filters.anaesthesiaTechnique?.trim() || "",
      urgency: filters.urgency?.trim() || "",
      complexityLevel: filters.complexityLevel?.trim() || "",
      contributorUserId: filters.contributorUserId?.trim() || ""
    };

    const [publishedCases, myCases, contributors, hasGrant] = await Promise.all([
      this.casesRepository.listPublished(user.unitId, normalizedFilters),
      this.casesRepository.listForUser(user.unitId, user.id),
      this.casesRepository.listActiveUsers(user.unitId),
      this.casesRepository.hasCaseReviewGrant(user.unitId, user.id)
    ]);
    const [relatedDocuments, relatedLearningResources] = await Promise.all([
      this.casesRepository.listPublishedDocuments(user.unitId),
      this.casesRepository.listPublishedLearningResources(user.unitId)
    ]);

    const canReviewQueue = isGlobalCaseReviewer(user, hasGrant);
    const reviewQueue = canReviewQueue ? await this.casesRepository.listReviewQueue(user.unitId) : [];
    const featuredCases = [...publishedCases]
      .sort((left, right) => {
        if (left.isFeatured !== right.isFeatured) {
          return left.isFeatured ? -1 : 1;
        }

        if (left.hadCriticalEvent !== right.hadCriticalEvent) {
          return left.hadCriticalEvent ? -1 : 1;
        }

        if (left.complexityLevel !== right.complexityLevel) {
          return left.complexityLevel === "complex" || left.complexityLevel === "critical_event" ? -1 : 1;
        }

        return right.createdAt.localeCompare(left.createdAt);
      })
      .slice(0, 3);

    return {
      title: "Teaching Cases",
      subtitle: "Teaching cases, reflections, and shared learning",
      publishedCases,
      featuredCases,
      myCases,
      contributors,
      reviewQueue,
      canReviewQueue,
      filters: normalizedFilters,
      browseStats: {
        publishedCount: publishedCases.length,
        featuredCount: featuredCases.length,
        myCaseCount: myCases.length
      },
      caseEntryOptions,
      relatedDocuments,
      relatedLearningResources
    };
  }

  async detail(user: AuthenticatedUser, caseId: string) {
    const [caseItem, comments, hasGrant] = await Promise.all([
      this.casesRepository.getById(caseId, user.unitId),
      this.casesRepository.listReviewComments(caseId),
      this.casesRepository.hasCaseReviewGrant(user.unitId, user.id)
    ]);

    if (!caseItem) {
      throw new HttpError(404, "Case not found.");
    }

    const isContributor =
      caseItem.createdByUserId === user.id || caseItem.contributorUserIds.includes(user.id);
    const canReview = isGlobalCaseReviewer(user, hasGrant);
    const canSuggestEdits = canReview || isContributor;
    const canFinalize = isFinalCaseApprover(user);

    if (caseItem.status !== "published" && !canSuggestEdits) {
      throw new HttpError(403, "This case is not available to you.");
    }

    return {
      title: caseItem.title,
      caseItem,
      comments,
      canSuggestEdits,
      canReview,
      canFinalize,
      isContributor
    };
  }

  async create(
    user: AuthenticatedUser,
    input: {
      title: string;
      subtitle: string;
      summary: string;
      learningPoints: string;
      whyThisCaseMatters: string;
      keyDecisionPoints: string;
      whatWentWell: string;
      whatCouldImprove: string;
      takeHomePoints: string;
      specialtyArea: string;
      anaesthesiaTechnique: string;
      urgency: string;
      patientAgeBand: string;
      complexityLevel: string;
      setting: string;
      hadCriticalEvent: boolean;
      status: "draft" | "submitted";
      tags: string[];
      contributorUserIds: string[];
      relatedDocumentIds: string[];
      relatedLearningResourceIds: string[];
    }
  ): Promise<void> {
    const activeUsers = await this.casesRepository.listActiveUsers(user.unitId);
    const allowedUserIds = new Set(activeUsers.map((person) => person.id));
    const relatedDocuments = await this.casesRepository.listPublishedDocuments(user.unitId);
    const relatedLearningResources = await this.casesRepository.listPublishedLearningResources(user.unitId);
    const allowedDocumentIds = new Set(relatedDocuments.map((item) => item.id));
    const allowedLearningIds = new Set(relatedLearningResources.map((item) => item.id));
    const contributorUserIds = Array.from(new Set([user.id, ...input.contributorUserIds])).filter((id) =>
      allowedUserIds.has(id)
    );
    const relatedDocumentIds = Array.from(new Set(input.relatedDocumentIds)).filter((id) => allowedDocumentIds.has(id));
    const relatedLearningResourceIds = Array.from(new Set(input.relatedLearningResourceIds)).filter((id) =>
      allowedLearningIds.has(id)
    );

    if (!contributorUserIds.includes(user.id)) {
      throw new HttpError(400, "The case author must remain part of the contributor list.");
    }

    if (!input.title.trim() || !input.summary.trim()) {
      throw new HttpError(400, "Case title and summary are required.");
    }

    const id = await this.casesRepository.create(user.unitId, user.id, {
      ...input,
      title: input.title.trim(),
      subtitle: input.subtitle.trim(),
      summary: input.summary.trim(),
      learningPoints: input.learningPoints.trim(),
      whyThisCaseMatters: input.whyThisCaseMatters.trim(),
      keyDecisionPoints: input.keyDecisionPoints.trim(),
      whatWentWell: input.whatWentWell.trim(),
      whatCouldImprove: input.whatCouldImprove.trim(),
      takeHomePoints: input.takeHomePoints.trim(),
      tags: input.tags,
      contributorUserIds,
      relatedDocumentIds,
      relatedLearningResourceIds
    });

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "cases.entry_created",
      entityType: "case_archive_entry",
      entityId: id,
      metadata: {
        title: input.title.trim(),
        tags: input.tags,
        status: input.status,
        contributorCount: contributorUserIds.length
      }
    });
  }

  async addComment(
    user: AuthenticatedUser,
    caseId: string,
    input: { comment: string; commentType: "note" | "suggestion" }
  ): Promise<void> {
    const caseItem = await this.casesRepository.getById(caseId, user.unitId);
    if (!caseItem) {
      throw new HttpError(404, "Case not found.");
    }

    const hasGrant = await this.casesRepository.hasCaseReviewGrant(user.unitId, user.id);
    const isContributor =
      caseItem.createdByUserId === user.id || caseItem.contributorUserIds.includes(user.id);
    const canSuggestEdits = isGlobalCaseReviewer(user, hasGrant) || isContributor;

    if (!canSuggestEdits) {
      throw new HttpError(403, "You do not have permission to comment on this case.");
    }

    const comment = input.comment.trim();
    if (!comment) {
      throw new HttpError(400, "Comment text is required.");
    }

    const commentId = await this.casesRepository.addReviewComment({
      caseId,
      authorUserId: user.id,
      comment,
      commentType: input.commentType
    });

    await this.auditRepository.record({
      actorUserId: user.id,
      action: input.commentType === "suggestion" ? "cases.edit_suggested" : "cases.comment_added",
      entityType: "case_archive_entry",
      entityId: caseId,
      metadata: { commentId }
    });
  }

  async updateStatus(user: AuthenticatedUser, caseId: string, nextStatus: string): Promise<void> {
    const caseItem = await this.casesRepository.getById(caseId, user.unitId);
    if (!caseItem) {
      throw new HttpError(404, "Case not found.");
    }

    const hasGrant = await this.casesRepository.hasCaseReviewGrant(user.unitId, user.id);
    const isContributor =
      caseItem.createdByUserId === user.id || caseItem.contributorUserIds.includes(user.id);
    const canReview = isGlobalCaseReviewer(user, hasGrant);
    const canFinalize = isFinalCaseApprover(user);

    const contributorStatuses = new Set(["submitted"]);
    const reviewerStatuses = new Set(["changes_requested", "approved"]);
    const finalStatuses = new Set(["published", "archived"]);

    if (contributorStatuses.has(nextStatus)) {
      if (!isContributor) {
        throw new HttpError(403, "Only contributors can submit this case for review.");
      }
    } else if (reviewerStatuses.has(nextStatus)) {
      if (!canReview) {
        throw new HttpError(403, "You do not have permission to review this case.");
      }
    } else if (finalStatuses.has(nextStatus)) {
      if (!canFinalize) {
        throw new HttpError(403, "You do not have permission to publish or archive this case.");
      }
    } else {
      throw new HttpError(400, "Unsupported case status.");
    }

    await this.casesRepository.updateStatus(caseId, nextStatus);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: `cases.status_${nextStatus}`,
      entityType: "case_archive_entry",
      entityId: caseId,
      metadata: { status: nextStatus }
    });
  }

  async updateFeatured(user: AuthenticatedUser, caseId: string, isFeatured: boolean): Promise<void> {
    const caseItem = await this.casesRepository.getById(caseId, user.unitId);
    if (!caseItem) {
      throw new HttpError(404, "Case not found.");
    }

    if (!isFinalCaseApprover(user)) {
      throw new HttpError(403, "You do not have permission to update featured cases.");
    }

    await this.casesRepository.setFeatured(caseId, isFeatured);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: isFeatured ? "cases.featured_enabled" : "cases.featured_disabled",
      entityType: "case_archive_entry",
      entityId: caseId,
      metadata: { isFeatured }
    });
  }
}
