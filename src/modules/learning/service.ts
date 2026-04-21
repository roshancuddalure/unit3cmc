import type { AuthenticatedUser } from "../../shared/types/domain";
import { HttpError } from "../../shared/http-error";
import { AuditRepository } from "../audit/repository";
import {
  type AcademyProgramTree,
  type AssignableUserRecord,
  type LearnerAcademySummary,
  type LearningResourceRecord,
  type ProgramSummaryRow,
  LearningRepository
} from "./repository";

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function requireNonEmpty(value: string, label: string): string {
  const cleaned = value.trim();
  if (!cleaned) {
    throw new HttpError(400, `${label} is required.`);
  }

  return cleaned;
}

function normalizeDirection(value: string): "up" | "down" {
  if (value === "up" || value === "down") {
    return value;
  }

  throw new HttpError(400, "Choose a valid movement direction.");
}

function deriveItemType(resource: LearningResourceRecord): string {
  if (resource.h5pContentId) {
    return "h5p";
  }

  const normalizedType = resource.resourceType.trim().toLowerCase();
  if (normalizedType.includes("quiz")) {
    return "quiz";
  }
  if (normalizedType.includes("article")) {
    return "article";
  }
  if (normalizedType.includes("reference")) {
    return "reference";
  }

  return "resource";
}

export class LearningService {
  constructor(
    private readonly learningRepository: LearningRepository,
    private readonly auditRepository: AuditRepository
  ) {}

  async list(user: AuthenticatedUser, filters: { programId?: string } = {}) {
    const resources = await this.learningRepository.list(user.unitId);
    const creatorPrograms =
      user.role === "super_admin" || user.role === "unit_admin_or_faculty"
        ? await this.learningRepository.listPrograms(user.unitId)
        : [];
    const creatorProgramSummary =
      user.role === "super_admin" || user.role === "unit_admin_or_faculty"
        ? this.resolveCreatorProgram(creatorPrograms, filters.programId)
        : null;
    const creatorProgramTree = creatorProgramSummary
      ? await this.learningRepository.getProgramTree(user.unitId, creatorProgramSummary.id)
      : null;
    const assignableUsers =
      user.role === "super_admin" || user.role === "unit_admin_or_faculty"
        ? await this.learningRepository.listAssignableUsers(user.unitId)
        : [];
    const cohorts =
      user.role === "super_admin" || user.role === "unit_admin_or_faculty"
        ? await this.learningRepository.listCohorts(user.unitId)
        : [];
    const creatorProgramAudiences =
      creatorProgramSummary && (user.role === "super_admin" || user.role === "unit_admin_or_faculty")
        ? await this.learningRepository.listProgramAudiences(creatorProgramSummary.id)
        : [];

    const learnerPrograms =
      user.role === "super_admin" || user.role === "unit_admin_or_faculty"
        ? []
        : await this.learningRepository.listAssignedPrograms(user.unitId, user.id, user.role);
    const learnerProgramTrees = await Promise.all(
      learnerPrograms.map(async (program) => this.learningRepository.getProgramTree(user.unitId, program.id, user.id))
    );
    const visibleLearnerProgramTrees = learnerProgramTrees.filter((program): program is AcademyProgramTree => Boolean(program));

    const learnerAnalytics =
      user.role !== "super_admin" && user.role !== "unit_admin_or_faculty"
        ? await this.learningRepository.getLearnerAcademySummary(user.unitId, user.id)
        : null;
    const facultyAnalytics =
      user.role === "super_admin" || user.role === "unit_admin_or_faculty"
        ? await this.learningRepository.getFacultyAcademyAnalytics(user.unitId)
        : null;

    return {
      title: "Learning Library",
      resources,
      creatorPrograms,
      selectedProgramId: creatorProgramSummary?.id ?? "",
      creatorProgramTree,
      learnerProgramTrees: visibleLearnerProgramTrees,
      unplacedResources: resources.filter((resource) => resource.placementCount === 0),
      academyStats: this.buildAcademyStats(creatorProgramTree, resources),
      learnerAnalytics: this.buildLearnerAnalytics(visibleLearnerProgramTrees, learnerAnalytics),
      facultyAnalytics,
      assignableUsers,
      cohorts,
      creatorProgramAudiences,
      audienceRoleOptions: this.buildAudienceRoleOptions(assignableUsers)
    };
  }

  private resolveCreatorProgram(programs: ProgramSummaryRow[], requestedProgramId?: string): ProgramSummaryRow | null {
    if (!programs.length) {
      return null;
    }

    const requested = requestedProgramId ? programs.find((program) => program.id === requestedProgramId) : null;
    return requested ?? programs[0] ?? null;
  }

  private buildAcademyStats(programTree: AcademyProgramTree | null, resources: LearningResourceRecord[]) {
    const chapters = programTree?.chapters.length ?? 0;
    const subchapters = programTree?.chapters.reduce((sum, chapter) => sum + chapter.subchapters.length, 0) ?? 0;
    const placedItems =
      programTree?.chapters.reduce(
        (sum, chapter) => sum + chapter.subchapters.reduce((subSum, subchapter) => subSum + subchapter.items.length, 0),
        0
      ) ?? 0;

    return {
      chapters,
      subchapters,
      placedItems,
      unplacedResources: resources.filter((resource) => resource.placementCount === 0).length
    };
  }

  private buildLearnerAnalytics(
    learnerProgramTrees: AcademyProgramTree[],
    learnerAnalytics: LearnerAcademySummary | null
  ): (LearnerAcademySummary & { totalRoadmapItems: number }) | null {
    if (!learnerProgramTrees.length) {
      return null;
    }

    const totalRoadmapItems = learnerProgramTrees.reduce(
      (programSum, program) =>
        programSum +
        program.chapters.reduce(
          (sum, chapter) => sum + chapter.subchapters.reduce((subSum, subchapter) => subSum + subchapter.items.length, 0),
          0
        ),
      0
    );

    return {
      trackedItems: learnerAnalytics?.trackedItems ?? 0,
      startedItems: learnerAnalytics?.startedItems ?? 0,
      completedItems: learnerAnalytics?.completedItems ?? 0,
      passedAssessments: learnerAnalytics?.passedAssessments ?? 0,
      totalAttempts: learnerAnalytics?.totalAttempts ?? 0,
      averageBestScore: learnerAnalytics?.averageBestScore ?? null,
      totalRoadmapItems
    };
  }

  private buildAudienceRoleOptions(assignableUsers: AssignableUserRecord[]) {
    const seen = new Set<string>();
    const options: Array<{ value: string; label: string }> = [];

    for (const user of assignableUsers) {
      if (seen.has(user.role)) {
        continue;
      }
      seen.add(user.role);
      options.push({
        value: user.role,
        label:
          user.role === "postgraduate"
            ? "Postgraduates"
            : user.role === "unit_admin_or_faculty"
              ? "Faculty / consultants"
              : user.role === "reviewer"
                ? "Reviewers"
                : user.role
      });
    }

    return options;
  }

  async create(user: AuthenticatedUser, title: string, resourceType: string, url: string): Promise<void> {
    const id = await this.learningRepository.create(user.unitId, user.id, title, resourceType, url);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "learning.resource_created",
      entityType: "learning_resource",
      entityId: id,
      metadata: { title, resourceType }
    });
  }

  async markProgress(user: AuthenticatedUser, learningResourceId: string, status: string): Promise<void> {
    await this.learningRepository.markProgress(user.id, user.unitId, learningResourceId, status);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "learning.progress_updated",
      entityType: "learning_resource",
      entityId: learningResourceId,
      metadata: { status }
    });
  }

  async markAcademyItemProgress(user: AuthenticatedUser, academyItemId: string, status: string): Promise<void> {
    await this.learningRepository.markAcademyItemProgress(user.id, user.unitId, academyItemId, status);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.item_progress_updated",
      entityType: "academy_item",
      entityId: academyItemId,
      metadata: { status }
    });
  }

  async createProgram(user: AuthenticatedUser, title: string, description: string, status: string): Promise<string> {
    const cleanedTitle = requireNonEmpty(title, "Program title");
    const id = await this.learningRepository.createProgram(
      user.unitId,
      user.id,
      cleanedTitle,
      description.trim(),
      status,
      slugify(cleanedTitle)
    );
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.program_created",
      entityType: "academy_program",
      entityId: id,
      metadata: { title: cleanedTitle, status }
    });
    return id;
  }

  async updateProgram(user: AuthenticatedUser, programId: string, title: string, description: string, status: string): Promise<void> {
    const cleanedTitle = requireNonEmpty(title, "Program title");
    await this.learningRepository.updateProgram(user.unitId, programId, cleanedTitle, description.trim(), status);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.program_updated",
      entityType: "academy_program",
      entityId: programId,
      metadata: { title: cleanedTitle, status }
    });
  }

  async deleteProgram(user: AuthenticatedUser, programId: string): Promise<void> {
    await this.learningRepository.deleteProgram(user.unitId, programId);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.program_deleted",
      entityType: "academy_program",
      entityId: programId,
      metadata: {}
    });
  }

  async createChapter(user: AuthenticatedUser, programId: string, title: string, summary: string, status: string): Promise<void> {
    const cleanedTitle = requireNonEmpty(title, "Chapter title");
    const id = await this.learningRepository.createChapter(programId, cleanedTitle, summary.trim(), slugify(cleanedTitle), status);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.chapter_created",
      entityType: "academy_chapter",
      entityId: id,
      metadata: { title: cleanedTitle, programId, status }
    });
  }

  async updateChapter(user: AuthenticatedUser, chapterId: string, title: string, summary: string, status: string): Promise<void> {
    const cleanedTitle = requireNonEmpty(title, "Chapter title");
    await this.learningRepository.updateChapter(user.unitId, chapterId, cleanedTitle, summary.trim(), status);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.chapter_updated",
      entityType: "academy_chapter",
      entityId: chapterId,
      metadata: { title: cleanedTitle, status }
    });
  }

  async moveChapter(user: AuthenticatedUser, chapterId: string, direction: string): Promise<void> {
    const normalizedDirection = normalizeDirection(direction);
    await this.learningRepository.moveChapter(user.unitId, chapterId, normalizedDirection);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.chapter_moved",
      entityType: "academy_chapter",
      entityId: chapterId,
      metadata: { direction: normalizedDirection }
    });
  }

  async deleteChapter(user: AuthenticatedUser, chapterId: string): Promise<void> {
    await this.learningRepository.deleteChapter(user.unitId, chapterId);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.chapter_deleted",
      entityType: "academy_chapter",
      entityId: chapterId,
      metadata: {}
    });
  }

  async createSubchapter(
    user: AuthenticatedUser,
    chapterId: string,
    title: string,
    summary: string,
    status: string
  ): Promise<void> {
    const cleanedTitle = requireNonEmpty(title, "Subchapter title");
    const id = await this.learningRepository.createSubchapter(chapterId, cleanedTitle, summary.trim(), slugify(cleanedTitle), status);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.subchapter_created",
      entityType: "academy_subchapter",
      entityId: id,
      metadata: { title: cleanedTitle, chapterId, status }
    });
  }

  async updateSubchapter(
    user: AuthenticatedUser,
    subchapterId: string,
    title: string,
    summary: string,
    status: string
  ): Promise<void> {
    const cleanedTitle = requireNonEmpty(title, "Subchapter title");
    await this.learningRepository.updateSubchapter(user.unitId, subchapterId, cleanedTitle, summary.trim(), status);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.subchapter_updated",
      entityType: "academy_subchapter",
      entityId: subchapterId,
      metadata: { title: cleanedTitle, status }
    });
  }

  async moveSubchapter(user: AuthenticatedUser, subchapterId: string, direction: string): Promise<void> {
    const normalizedDirection = normalizeDirection(direction);
    await this.learningRepository.moveSubchapter(user.unitId, subchapterId, normalizedDirection);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.subchapter_moved",
      entityType: "academy_subchapter",
      entityId: subchapterId,
      metadata: { direction: normalizedDirection }
    });
  }

  async deleteSubchapter(user: AuthenticatedUser, subchapterId: string): Promise<void> {
    await this.learningRepository.deleteSubchapter(user.unitId, subchapterId);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.subchapter_deleted",
      entityType: "academy_subchapter",
      entityId: subchapterId,
      metadata: {}
    });
  }

  async placeResource(
    user: AuthenticatedUser,
    subchapterId: string,
    learningResourceId: string,
    titleOverride: string,
    isRequired: string,
    isAssessment: string,
    estimatedMinutes: string
  ): Promise<void> {
    const resources = await this.learningRepository.list(user.unitId);
    const resource = resources.find((item) => item.id === learningResourceId);
    if (!resource) {
      throw new Error("Selected learning resource could not be found.");
    }

    const id = await this.learningRepository.placeResourceInSubchapter({
      subchapterId,
      learningResourceId,
      itemType: deriveItemType(resource),
      titleOverride: titleOverride.trim(),
      isRequired: isRequired !== "false",
      isAssessment: isAssessment === "true",
      estimatedMinutes: Math.max(0, Number(estimatedMinutes || 0) || 0),
      status: resource.status
    });

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.item_placed",
      entityType: "academy_item",
      entityId: id,
      metadata: { subchapterId, learningResourceId, resourceTitle: resource.title }
    });
  }

  async updateAcademyItem(
    user: AuthenticatedUser,
    academyItemId: string,
    input: {
      titleOverride: string;
      isRequired: string;
      isAssessment: string;
      estimatedMinutes: string;
      status: string;
      subchapterId: string;
    }
  ): Promise<void> {
    await this.learningRepository.updateAcademyItem({
      unitId: user.unitId,
      academyItemId,
      titleOverride: input.titleOverride.trim(),
      isRequired: input.isRequired !== "false",
      isAssessment: input.isAssessment === "true",
      estimatedMinutes: Math.max(0, Number(input.estimatedMinutes || 0) || 0),
      status: input.status,
      subchapterId: input.subchapterId.trim()
    });
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.item_updated",
      entityType: "academy_item",
      entityId: academyItemId,
      metadata: { subchapterId: input.subchapterId.trim(), status: input.status }
    });
  }

  async moveAcademyItem(user: AuthenticatedUser, academyItemId: string, direction: string): Promise<void> {
    const normalizedDirection = normalizeDirection(direction);
    await this.learningRepository.moveAcademyItem(user.unitId, academyItemId, normalizedDirection);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.item_moved",
      entityType: "academy_item",
      entityId: academyItemId,
      metadata: { direction: normalizedDirection }
    });
  }

  async deleteAcademyItem(user: AuthenticatedUser, academyItemId: string): Promise<void> {
    await this.learningRepository.deleteAcademyItem(user.unitId, academyItemId);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.item_deleted",
      entityType: "academy_item",
      entityId: academyItemId,
      metadata: {}
    });
  }

  async createCohort(
    user: AuthenticatedUser,
    title: string,
    description: string,
    audienceKind: string,
    status: string
  ): Promise<void> {
    const cleanedTitle = title.trim();
    const id = await this.learningRepository.createCohort(
      user.unitId,
      user.id,
      cleanedTitle,
      description.trim(),
      audienceKind,
      status,
      slugify(cleanedTitle)
    );
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.cohort_created",
      entityType: "academy_cohort",
      entityId: id,
      metadata: { title: cleanedTitle, audienceKind, status }
    });
  }

  async addCohortMember(user: AuthenticatedUser, cohortId: string, memberUserId: string): Promise<void> {
    await this.learningRepository.addCohortMember(user.unitId, cohortId, memberUserId);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.cohort_member_added",
      entityType: "academy_cohort",
      entityId: cohortId,
      metadata: { memberUserId }
    });
  }

  async removeCohortMember(user: AuthenticatedUser, cohortId: string, memberUserId: string): Promise<void> {
    await this.learningRepository.removeCohortMember(user.unitId, cohortId, memberUserId);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.cohort_member_removed",
      entityType: "academy_cohort",
      entityId: cohortId,
      metadata: { memberUserId }
    });
  }

  async assignProgramAudience(
    user: AuthenticatedUser,
    programId: string,
    accessScope: string,
    roleKey: string,
    cohortId: string,
    audienceUserId: string
  ): Promise<void> {
    const id = await this.learningRepository.assignProgramAudience({
      unitId: user.unitId,
      programId,
      accessScope,
      roleKey: roleKey.trim(),
      cohortId: cohortId.trim(),
      userId: audienceUserId.trim()
    });
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.program_audience_assigned",
      entityType: "academy_program",
      entityId: programId,
      metadata: { audienceId: id, accessScope, roleKey, cohortId, audienceUserId }
    });
  }

  async removeProgramAudience(user: AuthenticatedUser, audienceId: string): Promise<void> {
    await this.learningRepository.removeProgramAudience(user.unitId, audienceId);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: "academy.program_audience_removed",
      entityType: "academy_program_audience",
      entityId: audienceId,
      metadata: {}
    });
  }
}
