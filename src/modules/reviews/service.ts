import { HttpError } from "../../shared/http-error";
import type { AuthenticatedUser } from "../../shared/types/domain";
import { AuditRepository } from "../audit/repository";
import { LogbookRepository } from "../logbook/repository";
import { ReviewsRepository } from "./repository";

function buildSubmissionNarrative(input: {
  traineeName: string;
  start: string;
  end: string;
  totalCases: number;
  domainCoverage: number;
  complicationCount: number;
  topDomain?: string;
  topSupervision?: string;
}) {
  if (input.totalCases === 0) {
    return `${input.traineeName} has no de-identified case entries recorded for this submitted period.`;
  }

  return [
    `${input.traineeName} logged ${input.totalCases} cases between ${input.start} and ${input.end}.`,
    `${input.domainCoverage} clinical domain${input.domainCoverage === 1 ? "" : "s"} were represented.`,
    input.topDomain ? `Most activity fell under ${input.topDomain}.` : "",
    input.topSupervision ? `Supervision was mainly ${input.topSupervision}.` : "",
    input.complicationCount > 0
      ? `${input.complicationCount} case${input.complicationCount === 1 ? " was" : "s were"} flagged for complication follow-up.`
      : "No flagged complications were recorded in this period."
  ].filter(Boolean).join(" ");
}

export class ReviewsService {
  constructor(
    private readonly reviewsRepository: ReviewsRepository,
    private readonly logbookRepository: LogbookRepository,
    private readonly auditRepository: AuditRepository
  ) {}

  async list(user: AuthenticatedUser) {
    const submissions = await this.reviewsRepository.listPending(user.unitId);
    const submissionsWithAnalysis = await Promise.all(
      submissions.map(async (submission) => {
        const summary = await this.logbookRepository.getPeriodSummary(
          submission.userId,
          submission.weekStartDate,
          submission.weekEndDate
        );

        return {
          ...submission,
          summary,
          analysisNarrative: buildSubmissionNarrative({
            traineeName: submission.traineeName,
            start: submission.weekStartDate,
            end: submission.weekEndDate,
            totalCases: summary.totalCases,
            domainCoverage: summary.domainCoverage,
            complicationCount: summary.complicationCount,
            topDomain: summary.domainMix[0]?.label,
            topSupervision: summary.supervisionMix[0]?.label
          })
        };
      })
    );

    return {
      title: "Weekly reviews",
      submissions: submissionsWithAnalysis
    };
  }

  async submitWeeklySummary(user: AuthenticatedUser, weekStartDate: string, weekEndDate: string): Promise<void> {
    if (!weekStartDate || !weekEndDate || weekStartDate > weekEndDate) {
      throw new HttpError(400, "Choose a valid weekly reporting period.");
    }

    const summary = await this.logbookRepository.getPeriodSummary(user.id, weekStartDate, weekEndDate);
    if (summary.totalCases === 0) {
      throw new HttpError(400, "Add at least one de-identified logbook entry before submitting a weekly report.");
    }

    const submissionId = await this.reviewsRepository.createWeeklySubmission(
      user.id,
      user.unitId,
      weekStartDate,
      weekEndDate
    );

    await this.auditRepository.record({
      actorUserId: user.id,
      action: "reviews.weekly_submission_created",
      entityType: "weekly_submission",
      entityId: submissionId,
      metadata: {
        weekStartDate,
        weekEndDate,
        totalCases: summary.totalCases
      }
    });
  }

  async reviewSubmission(
    user: AuthenticatedUser,
    submissionId: string,
    decision: "approved" | "returned",
    comments: string
  ): Promise<void> {
    await this.reviewsRepository.decide(submissionId, user.id, decision, comments);
    await this.auditRepository.record({
      actorUserId: user.id,
      action: `reviews.${decision}`,
      entityType: "weekly_submission",
      entityId: submissionId,
      metadata: { comments }
    });
  }
}
