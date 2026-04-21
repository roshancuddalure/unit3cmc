import { hasPermission } from "../../shared/permissions";
import type { AuthenticatedUser } from "../../shared/types/domain";
import { DashboardRepository } from "./repository";

export class DashboardService {
  constructor(private readonly dashboardRepository: DashboardRepository) {}

  async getHome(user: AuthenticatedUser) {
    const canReview = hasPermission(user.role, "logbook:review");
    const snapshot = canReview
      ? await this.dashboardRepository.getUnitSnapshot(user.unitId)
      : await this.dashboardRepository.getUserSnapshot(user.id, user.unitId);

    return {
      title: "Dashboard",
      lead: canReview
        ? `Operational overview for ${user.displayName}`
        : `Your trainee workspace, ${user.displayName}`,
      cards: canReview
        ? [
            { label: "Unit logbook entries", value: snapshot.logbookEntries.toString() },
            { label: "Pending reviews", value: snapshot.pendingReviews.toString() },
            { label: "Active learners", value: snapshot.activeLearners.toString() },
            { label: "SOP documents", value: snapshot.sopDocuments.toString() },
            { label: "Case archive", value: snapshot.caseArchiveEntries.toString() }
          ]
        : [
            { label: "My logbook entries", value: snapshot.logbookEntries.toString() },
            { label: "My submissions awaiting review", value: snapshot.pendingReviews.toString() },
            { label: "My learning records", value: snapshot.activeLearners.toString() },
            { label: "Published SOPs", value: snapshot.sopDocuments.toString() },
            { label: "Case archive entries", value: snapshot.caseArchiveEntries.toString() }
          ],
      canReview
    };
  }
}
