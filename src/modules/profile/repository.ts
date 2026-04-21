import type { AppEnv } from "../../config/env";
import { query } from "../../db/query";

export interface ProfileChangeRequest {
  id: string;
  userId: string;
  requestedFields: {
    displayName?: string;
    phone?: string;
    designation?: string;
    department?: string;
    trainingYear?: string;
    employeeOrStudentId?: string;
    joiningDate?: string;
    notes?: string;
  };
  status: "pending" | "approved" | "rejected";
  reviewedByUserId: string | null;
  reviewedAt: string | null;
  reviewerNotes: string;
  createdAt: string;
}

export interface ProfileRecord {
  id: string;
  username: string;
  name: string;
  displayName: string | null;
  email: string;
  phone: string | null;
  designation: string | null;
  department: string | null;
  trainingYear: string | null;
  employeeOrStudentId: string | null;
  joiningDate: string | null;
  notes: string;
  roleKey: string;
  roleName: string;
  status: string;
}

export class ProfileRepository {
  constructor(private readonly env: AppEnv) {}

  async getById(userId: string): Promise<ProfileRecord | null> {
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
      role_key: string;
      role_name: string;
      status: string;
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
          r.key as role_key,
          r.name as role_name
        from users u
        inner join roles r on r.id = u.role_id
        where u.id = $1
      `,
      [userId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      username: row.username,
      name: row.name,
      displayName: row.display_name,
      email: row.email,
      phone: row.phone,
      designation: row.designation,
      department: row.department,
      trainingYear: row.training_year,
      employeeOrStudentId: row.employee_or_student_id,
      joiningDate: row.joining_date,
      notes: row.notes,
      roleKey: row.role_key,
      roleName: row.role_name,
      status: row.status
    };
  }

  async getLatestChangeRequest(userId: string): Promise<ProfileChangeRequest | null> {
    const result = await query<{
      id: string;
      user_id: string;
      requested_fields: Record<string, string>;
      status: string;
      reviewed_by_user_id: string | null;
      reviewed_at: string | null;
      reviewer_notes: string;
      created_at: string;
    }>(
      this.env,
      `
        select id, user_id, requested_fields, status,
               reviewed_by_user_id, reviewed_at::text, reviewer_notes, created_at::text
        from profile_change_requests
        where user_id = $1
        order by created_at desc
        limit 1
      `,
      [userId]
    );

    const row = result.rows[0];
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      requestedFields: row.requested_fields,
      status: row.status as ProfileChangeRequest["status"],
      reviewedByUserId: row.reviewed_by_user_id,
      reviewedAt: row.reviewed_at,
      reviewerNotes: row.reviewer_notes,
      createdAt: row.created_at
    };
  }

  async createChangeRequest(
    userId: string,
    requestedFields: ProfileChangeRequest["requestedFields"]
  ): Promise<void> {
    await query(
      this.env,
      `
        insert into profile_change_requests (user_id, requested_fields, status)
        values ($1, $2::jsonb, 'pending')
      `,
      [userId, JSON.stringify(requestedFields)]
    );
  }

  async updateOwnProfile(
    userId: string,
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
          display_name = $2,
          phone = $3,
          designation = $4,
          department = $5,
          training_year = $6,
          employee_or_student_id = $7,
          joining_date = $8,
          notes = $9
        where id = $1
      `,
      [
        userId,
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
}
