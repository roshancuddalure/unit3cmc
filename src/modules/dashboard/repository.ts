import type { AppEnv } from "../../config/env";
import { query } from "../../db/query";
import type { DashboardSnapshot } from "../../shared/types/domain";

interface CountRow {
  count: string;
}

export class DashboardRepository {
  constructor(private readonly env: AppEnv) {}

  async getUnitSnapshot(unitId: string): Promise<DashboardSnapshot> {
    const [logbook, reviews, learners, documents, cases] = await Promise.all([
      query<CountRow>(this.env, "select count(*)::text as count from logbook_entries where unit_id = $1", [unitId]),
      query<CountRow>(
        this.env,
        "select count(*)::text as count from weekly_submissions where unit_id = $1 and status = 'submitted'",
        [unitId]
      ),
      query<CountRow>(this.env, "select count(distinct user_id)::text as count from course_progress where unit_id = $1", [unitId]),
      query<CountRow>(this.env, "select count(*)::text as count from documents where unit_id = $1", [unitId]),
      query<CountRow>(this.env, "select count(*)::text as count from case_archive_entries where unit_id = $1", [unitId])
    ]);

    return {
      logbookEntries: Number(logbook.rows[0]?.count ?? 0),
      pendingReviews: Number(reviews.rows[0]?.count ?? 0),
      activeLearners: Number(learners.rows[0]?.count ?? 0),
      sopDocuments: Number(documents.rows[0]?.count ?? 0),
      caseArchiveEntries: Number(cases.rows[0]?.count ?? 0)
    };
  }

  async getUserSnapshot(userId: string, unitId: string): Promise<DashboardSnapshot> {
    const [logbook, reviews, learners, documents, cases] = await Promise.all([
      query<CountRow>(this.env, "select count(*)::text as count from logbook_entries where user_id = $1", [userId]),
      query<CountRow>(
        this.env,
        "select count(*)::text as count from weekly_submissions where user_id = $1 and status = 'submitted'",
        [userId]
      ),
      query<CountRow>(this.env, "select count(*)::text as count from course_progress where user_id = $1", [userId]),
      query<CountRow>(this.env, "select count(*)::text as count from documents where unit_id = $1 and status = 'published'", [unitId]),
      query<CountRow>(this.env, "select count(*)::text as count from case_archive_entries where unit_id = $1", [unitId])
    ]);

    return {
      logbookEntries: Number(logbook.rows[0]?.count ?? 0),
      pendingReviews: Number(reviews.rows[0]?.count ?? 0),
      activeLearners: Number(learners.rows[0]?.count ?? 0),
      sopDocuments: Number(documents.rows[0]?.count ?? 0),
      caseArchiveEntries: Number(cases.rows[0]?.count ?? 0)
    };
  }
}
