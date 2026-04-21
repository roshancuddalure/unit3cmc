import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("academy_cohorts", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    created_by_user_id: { type: "uuid", references: "users", onDelete: "set null" },
    title: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(160)", notNull: true },
    audience_kind: { type: "varchar(32)", notNull: true, default: "mixed" },
    description: { type: "text", notNull: true, default: "" },
    status: { type: "varchar(32)", notNull: true, default: "active" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.addConstraint("academy_cohorts", "academy_cohorts_unit_slug_unique", {
    unique: ["unit_id", "slug"]
  });

  pgm.createTable("academy_cohort_members", {
    cohort_id: { type: "uuid", notNull: true, references: "academy_cohorts", onDelete: "cascade" },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.addConstraint("academy_cohort_members", "academy_cohort_members_pkey", {
    primaryKey: ["cohort_id", "user_id"]
  });

  pgm.createTable("academy_program_audiences", {
    id: { type: "uuid", primaryKey: true },
    program_id: { type: "uuid", notNull: true, references: "academy_programs", onDelete: "cascade" },
    access_scope: { type: "varchar(32)", notNull: true },
    role_key: { type: "varchar(64)" },
    cohort_id: { type: "uuid", references: "academy_cohorts", onDelete: "set null" },
    user_id: { type: "uuid", references: "users", onDelete: "set null" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.addIndex("academy_cohorts", ["unit_id", "status"], {
    name: "idx_academy_cohorts_unit_status"
  });
  pgm.addIndex("academy_cohort_members", ["user_id"], {
    name: "idx_academy_cohort_members_user"
  });
  pgm.addIndex("academy_program_audiences", ["program_id"], {
    name: "idx_academy_program_audiences_program"
  });
  pgm.addIndex("academy_program_audiences", ["cohort_id"], {
    name: "idx_academy_program_audiences_cohort"
  });
  pgm.addIndex("academy_program_audiences", ["user_id"], {
    name: "idx_academy_program_audiences_user"
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("academy_program_audiences", ["user_id"], {
    ifExists: true,
    name: "idx_academy_program_audiences_user"
  });
  pgm.dropIndex("academy_program_audiences", ["cohort_id"], {
    ifExists: true,
    name: "idx_academy_program_audiences_cohort"
  });
  pgm.dropIndex("academy_program_audiences", ["program_id"], {
    ifExists: true,
    name: "idx_academy_program_audiences_program"
  });
  pgm.dropIndex("academy_cohort_members", ["user_id"], {
    ifExists: true,
    name: "idx_academy_cohort_members_user"
  });
  pgm.dropIndex("academy_cohorts", ["unit_id", "status"], {
    ifExists: true,
    name: "idx_academy_cohorts_unit_status"
  });

  pgm.dropTable("academy_program_audiences", { ifExists: true });
  pgm.dropConstraint("academy_cohort_members", "academy_cohort_members_pkey", { ifExists: true });
  pgm.dropTable("academy_cohort_members", { ifExists: true });
  pgm.dropConstraint("academy_cohorts", "academy_cohorts_unit_slug_unique", { ifExists: true });
  pgm.dropTable("academy_cohorts", { ifExists: true });
}
