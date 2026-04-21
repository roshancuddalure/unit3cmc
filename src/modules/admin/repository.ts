import type { AppEnv } from "../../config/env";
import { query } from "../../db/query";

export class AdminRepository {
  constructor(private readonly env: AppEnv) {}

  async getOverview(unitId: string) {
    const result = await query<{
      id: string;
      username: string;
      email: string;
      name: string;
      display_name: string | null;
      role_key: string;
      role_name: string;
      status: string;
      can_review_cases: boolean;
      must_change_password: boolean;
      approved_at: string | null;
      created_at: string;
    }>(
      this.env,
      `
        select
          u.id,
          u.username,
          u.email,
          u.name,
          u.display_name,
          u.status,
          u.can_review_cases,
          u.must_change_password,
          u.approved_at::text,
          u.created_at::text,
          r.key as role_key,
          r.name as role_name
        from users u
        inner join roles r on r.id = u.role_id
        where u.unit_id = $1
        order by
          case u.status
            when 'pending' then 1
            when 'active' then 2
            when 'suspended' then 3
            when 'archived' then 4
            else 5
          end,
          r.name,
          u.name
      `,
      [unitId]
    );

    return result.rows;
  }

  async listRoles() {
    const result = await query<{ key: string; name: string }>(
      this.env,
      `
        select key, name
        from roles
        order by name asc
      `
    );

    return result.rows;
  }

  async updateUserRole(userId: string, roleKey: string, unitId: string): Promise<void> {
    await query(
      this.env,
      `
        update users
        set role_id = (select id from roles where key = $2)
        where id = $1 and unit_id = $3
      `,
      [userId, roleKey, unitId]
    );
  }

  async updateUserStatus(
    userId: string,
    unitId: string,
    status: "active" | "suspended" | "archived",
    actorUserId: string
  ): Promise<void> {
    await query(
      this.env,
      `
        update users
        set
          status = $2::text,
          approved_by_user_id = case when $2::text = 'active' then $4 else approved_by_user_id end,
          approved_at = case when $2::text = 'active' then coalesce(approved_at, current_timestamp) else approved_at end,
          suspended_by_user_id = case when $2::text = 'suspended' then $4 else suspended_by_user_id end,
          suspended_at = case when $2::text = 'suspended' then current_timestamp else suspended_at end,
          archived_by_user_id = case when $2::text = 'archived' then $4 else archived_by_user_id end,
          archived_at = case when $2::text = 'archived' then current_timestamp else archived_at end
        where id = $1 and unit_id = $3
      `,
      [userId, status, unitId, actorUserId]
    );
  }

  async getUserDetail(userId: string, unitId: string) {
    const result = await query<{
      id: string;
      username: string;
      name: string;
      display_name: string | null;
      email: string;
      phone: string | null;
      designation: string | null;
      department: string | null;
      training_year: string | null;
      employee_or_student_id: string | null;
      joining_date: string | null;
      notes: string;
      status: string;
      can_review_cases: boolean;
      must_change_password: boolean;
      approved_at: string | null;
      suspended_at: string | null;
      archived_at: string | null;
      created_at: string;
      role_key: string;
      role_name: string;
    }>(
      this.env,
      `
        select
          u.id,
          u.username,
          u.name,
          u.display_name,
          u.email,
          u.phone,
          u.designation,
          u.department,
          u.training_year,
          u.employee_or_student_id,
          u.joining_date::text,
          u.notes,
          u.status,
          u.can_review_cases,
          u.must_change_password,
          u.approved_at::text,
          u.suspended_at::text,
          u.archived_at::text,
          u.created_at::text,
          r.key as role_key,
          r.name as role_name
        from users u
        inner join roles r on r.id = u.role_id
        where u.id = $1 and u.unit_id = $2
        limit 1
      `,
      [userId, unitId]
    );

    return result.rows[0] ?? null;
  }

  async listUserAuditEvents(userId: string) {
    const result = await query<{
      id: string;
      action: string;
      created_at: string;
      actor_name: string | null;
    }>(
      this.env,
      `
        select
          a.id,
          a.action,
          a.created_at::text,
          actor.name as actor_name
        from audit_events a
        left join users actor on actor.id = a.actor_user_id
        where a.entity_type = 'user' and a.entity_id = $1
        order by a.created_at desc
        limit 20
      `,
      [userId]
    );

    return result.rows;
  }

  async updateUserProfile(
    userId: string,
    unitId: string,
    input: {
      displayName: string;
      phone: string;
      designation: string;
      department: string;
      trainingYear: string;
      employeeOrStudentId: string;
      joiningDate: string;
      notes: string;
    }
  ): Promise<void> {
    await query(
      this.env,
      `
        update users
        set
          display_name = $3,
          phone = $4,
          designation = $5,
          department = $6,
          training_year = $7,
          employee_or_student_id = $8,
          joining_date = $9,
          notes = $10
        where id = $1 and unit_id = $2
      `,
      [
        userId,
        unitId,
        input.displayName.trim() || null,
        input.phone.trim() || null,
        input.designation.trim() || null,
        input.department.trim() || null,
        input.trainingYear.trim() || null,
        input.employeeOrStudentId.trim() || null,
        input.joiningDate.trim() || null,
        input.notes.trim()
      ]
    );
  }

  async listPendingProfileRequests(unitId: string) {
    const result = await query<{
      id: string;
      user_id: string;
      user_name: string;
      user_display_name: string | null;
      user_username: string;
      role_name: string;
      requested_fields: Record<string, string>;
      created_at: string;
    }>(
      this.env,
      `
        select
          r.id,
          r.user_id,
          u.name as user_name,
          u.display_name as user_display_name,
          u.username as user_username,
          ro.name as role_name,
          r.requested_fields,
          r.created_at::text
        from profile_change_requests r
        inner join users u on u.id = r.user_id
        inner join roles ro on ro.id = u.role_id
        where r.status = 'pending'
          and u.unit_id = $1
        order by r.created_at asc
      `,
      [unitId]
    );

    return result.rows;
  }

  async reviewProfileRequest(
    requestId: string,
    unitId: string,
    decision: "approved" | "rejected",
    reviewerUserId: string,
    reviewerNotes: string
  ): Promise<{ userId: string; requestedFields: Record<string, string> } | null> {
    const requestResult = await query<{
      user_id: string;
      requested_fields: Record<string, string>;
    }>(
      this.env,
      `
        update profile_change_requests
        set
          status = $2,
          reviewed_by_user_id = $3,
          reviewed_at = current_timestamp,
          reviewer_notes = $4
        where id = $1
          and status = 'pending'
          and user_id in (select id from users where unit_id = $5)
        returning user_id, requested_fields
      `,
      [requestId, decision, reviewerUserId, reviewerNotes, unitId]
    );

    const row = requestResult.rows[0];
    if (!row) return null;

    if (decision === "approved") {
      const f = row.requested_fields;
      await query(
        this.env,
        `
          update users
          set
            display_name = coalesce(nullif($2, ''), display_name),
            phone = coalesce(nullif($3, ''), phone),
            designation = coalesce(nullif($4, ''), designation),
            department = coalesce(nullif($5, ''), department),
            training_year = coalesce(nullif($6, ''), training_year),
            employee_or_student_id = coalesce(nullif($7, ''), employee_or_student_id),
            joining_date = coalesce(nullif($8, '')::date, joining_date),
            notes = coalesce(nullif($9, ''), notes)
          where id = $1
        `,
        [
          row.user_id,
          f.displayName ?? "",
          f.phone ?? "",
          f.designation ?? "",
          f.department ?? "",
          f.trainingYear ?? "",
          f.employeeOrStudentId ?? "",
          f.joiningDate ?? "",
          f.notes ?? ""
        ]
      );
    }

    return { userId: row.user_id, requestedFields: row.requested_fields };
  }

  async updateCaseReviewAccess(userId: string, unitId: string, canReviewCases: boolean): Promise<void> {
    await query(
      this.env,
      `
        update users
        set can_review_cases = $3
        where id = $1 and unit_id = $2
      `,
      [userId, unitId, canReviewCases]
    );
  }
}
