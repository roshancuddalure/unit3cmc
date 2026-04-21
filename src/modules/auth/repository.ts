import { randomUUID } from "crypto";
import type { AppEnv } from "../../config/env";
import { query } from "../../db/query";
import type { AuthenticatedUser, RoleKey, UserStatus } from "../../shared/types/domain";

interface UserRow {
  id: string;
  name: string;
  username: string;
  display_name: string | null;
  email: string;
  password_hash: string;
  unit_id: string;
  role_key: RoleKey;
  status: UserStatus;
  must_change_password: boolean;
}

export class AuthRepository {
  constructor(private readonly env: AppEnv) {}

  async findForLogin(identity: string): Promise<(AuthenticatedUser & { passwordHash: string }) | null> {
    const result = await query<UserRow>(
      this.env,
      `
        select
          u.id,
          u.name,
          u.username,
          u.display_name,
          u.email,
          u.password_hash,
          u.unit_id,
          u.status,
          u.must_change_password,
          r.key as role_key
        from users u
        inner join roles r on r.id = u.role_id
        where lower(u.email) = lower($1) or lower(u.username) = lower($1)
        limit 1
      `,
      [identity]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      name: row.name,
      username: row.username,
      displayName: row.display_name ?? row.name,
      email: row.email,
      unitId: row.unit_id,
      role: row.role_key,
      status: row.status,
      mustChangePassword: row.must_change_password,
      passwordHash: row.password_hash
    };
  }

  async createUser(input: {
    username: string;
    name: string;
    email: string;
    passwordHash: string;
    unitCode: string;
    roleKey: RoleKey;
    phone?: string;
    designation?: string;
    department?: string;
    trainingYear?: string;
    employeeOrStudentId?: string;
  }): Promise<AuthenticatedUser> {
    const result = await query<{
      id: string;
      unit_id: string;
      role_key: RoleKey;
      name: string;
      username: string;
      display_name: string | null;
      email: string;
      status: UserStatus;
      must_change_password: boolean;
    }>(
      this.env,
      `
        insert into users (
          id, unit_id, role_id, username, name, display_name, phone, designation, department,
          training_year, employee_or_student_id, email, password_hash, status, must_change_password
        )
        values (
          $1,
          (select id from units where code = $2),
          (select id from roles where key = $3),
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          'pending',
          false
        )
        returning
          id,
          unit_id,
          (select key from roles where id = users.role_id) as role_key,
          name,
          username,
          display_name,
          email,
          status,
          must_change_password
      `,
      [
        randomUUID(),
        input.unitCode,
        input.roleKey,
        input.username,
        input.name,
        input.name,
        input.phone?.trim() || null,
        input.designation?.trim() || null,
        input.department?.trim() || null,
        input.trainingYear?.trim() || null,
        input.employeeOrStudentId?.trim() || null,
        input.email,
        input.passwordHash
      ]
    );

    const row = result.rows[0];

    return {
      id: row.id,
      unitId: row.unit_id,
      role: row.role_key,
      name: row.name,
      username: row.username,
      displayName: row.display_name ?? row.name,
      email: row.email,
      status: row.status
      ,
      mustChangePassword: row.must_change_password
    };
  }

  async getPasswordHashByUserId(userId: string): Promise<string | null> {
    const result = await query<{ password_hash: string }>(
      this.env,
      `
        select password_hash
        from users
        where id = $1
        limit 1
      `,
      [userId]
    );

    return result.rows[0]?.password_hash ?? null;
  }

  async updatePasswordHash(userId: string, passwordHash: string): Promise<void> {
    await query(
      this.env,
      `
        update users
        set password_hash = $2
        where id = $1
      `,
      [userId, passwordHash]
    );
  }

  async setMustChangePassword(userId: string, mustChangePassword: boolean): Promise<void> {
    await query(
      this.env,
      `
        update users
        set must_change_password = $2
        where id = $1
      `,
      [userId, mustChangePassword]
    );
  }
}
