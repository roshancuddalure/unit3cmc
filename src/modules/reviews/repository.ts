import { randomUUID } from "crypto";
import type { AppEnv } from "../../config/env";
import { query } from "../../db/query";

export interface SubmissionSummary {
  id: string;
  userId: string;
  weekStartDate: string;
  weekEndDate: string;
  status: string;
  traineeName: string;
  reviewerComments: string;
}

export class ReviewsRepository {
  constructor(private readonly env: AppEnv) {}

  async listPending(unitId: string): Promise<SubmissionSummary[]> {
    const result = await query<{
      id: string;
      user_id: string;
      week_start_date: string;
      week_end_date: string;
      status: string;
      trainee_name: string;
      reviewer_comments: string;
    }>(
      this.env,
      `
        select
          ws.id,
          ws.user_id,
          ws.week_start_date::text,
          ws.week_end_date::text,
          ws.status,
          coalesce(u.display_name, u.name) as trainee_name,
          coalesce(
            (
              select rd.comments
              from review_decisions rd
              where rd.weekly_submission_id = ws.id
              order by rd.created_at desc
              limit 1
            ),
            ''
          ) as reviewer_comments
        from weekly_submissions ws
        inner join users u on u.id = ws.user_id
        where ws.unit_id = $1
        order by ws.week_start_date desc, ws.created_at desc
      `,
      [unitId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      weekStartDate: row.week_start_date,
      weekEndDate: row.week_end_date,
      status: row.status,
      traineeName: row.trainee_name,
      reviewerComments: row.reviewer_comments
    }));
  }

  async createWeeklySubmission(userId: string, unitId: string, weekStartDate: string, weekEndDate: string): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into weekly_submissions (id, user_id, unit_id, week_start_date, week_end_date, status)
        values ($1, $2, $3, $4, $5, 'submitted')
      `,
      [id, userId, unitId, weekStartDate, weekEndDate]
    );
    return id;
  }

  async decide(submissionId: string, reviewerId: string, decision: "approved" | "returned", comments: string): Promise<void> {
    await query(this.env, "update weekly_submissions set status = $2 where id = $1", [submissionId, decision]);
    await query(
      this.env,
      `
        insert into review_decisions (id, weekly_submission_id, reviewer_id, decision, comments)
        values ($1, $2, $3, $4, $5)
      `,
      [randomUUID(), submissionId, reviewerId, decision, comments]
    );
  }
}
