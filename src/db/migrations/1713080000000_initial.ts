import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createExtension("pgcrypto", { ifNotExists: true });

  pgm.createTable("units", {
    id: { type: "uuid", primaryKey: true },
    code: { type: "varchar(32)", notNull: true, unique: true },
    name: { type: "varchar(255)", notNull: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("roles", {
    id: { type: "uuid", primaryKey: true },
    key: { type: "varchar(64)", notNull: true, unique: true },
    name: { type: "varchar(120)", notNull: true }
  });

  pgm.createTable("users", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    role_id: { type: "uuid", notNull: true, references: "roles" },
    username: { type: "varchar(120)", notNull: true, unique: true },
    name: { type: "varchar(255)", notNull: true },
    email: { type: "varchar(255)", notNull: true, unique: true },
    password_hash: { type: "text", notNull: true },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("audit_events", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    actor_user_id: { type: "uuid", references: "users", onDelete: "set null" },
    action: { type: "varchar(255)", notNull: true },
    entity_type: { type: "varchar(120)", notNull: true },
    entity_id: { type: "text", notNull: true },
    metadata: { type: "jsonb", default: "{}" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("logbook_entries", {
    id: { type: "uuid", primaryKey: true },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    activity_date: { type: "date", notNull: true },
    procedure_name: { type: "varchar(255)", notNull: true },
    patient_reference: { type: "varchar(120)" },
    supervision_level: { type: "varchar(120)", notNull: true },
    notes: { type: "text", notNull: true, default: "" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("weekly_submissions", {
    id: { type: "uuid", primaryKey: true },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    week_start_date: { type: "date", notNull: true },
    week_end_date: { type: "date", notNull: true },
    status: { type: "varchar(32)", notNull: true, default: "submitted" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("review_decisions", {
    id: { type: "uuid", primaryKey: true },
    weekly_submission_id: { type: "uuid", notNull: true, references: "weekly_submissions", onDelete: "cascade" },
    reviewer_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    decision: { type: "varchar(32)", notNull: true },
    comments: { type: "text", notNull: true, default: "" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("documents", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    owner_user_id: { type: "uuid", references: "users", onDelete: "set null" },
    title: { type: "varchar(255)", notNull: true },
    category: { type: "varchar(120)", notNull: true },
    visibility: { type: "varchar(64)", notNull: true, default: "unit_internal" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("document_versions", {
    id: { type: "uuid", primaryKey: true },
    document_id: { type: "uuid", notNull: true, references: "documents", onDelete: "cascade" },
    version_number: { type: "integer", notNull: true },
    version_notes: { type: "text", notNull: true, default: "" },
    storage_key: { type: "text", notNull: true },
    original_file_name: { type: "text", notNull: true },
    created_by_user_id: { type: "uuid", references: "users", onDelete: "set null" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("learning_resources", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    created_by_user_id: { type: "uuid", references: "users", onDelete: "set null" },
    title: { type: "varchar(255)", notNull: true },
    resource_type: { type: "varchar(120)", notNull: true },
    source_url: { type: "text", notNull: true },
    status: { type: "varchar(32)", notNull: true, default: "draft" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("course_progress", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    learning_resource_id: { type: "uuid", notNull: true, references: "learning_resources", onDelete: "cascade" },
    status: { type: "varchar(32)", notNull: true, default: "not_started" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.addConstraint("course_progress", "course_progress_user_resource_unique", {
    unique: ["user_id", "learning_resource_id"]
  });

  pgm.createTable("case_archive_entries", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    created_by_user_id: { type: "uuid", references: "users", onDelete: "set null" },
    title: { type: "varchar(255)", notNull: true },
    summary: { type: "text", notNull: true },
    tags: { type: "text[]", notNull: true, default: "{}" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.sql(`
    CREATE TABLE "session" (
      "sid" varchar NOT NULL PRIMARY KEY,
      "sess" json NOT NULL,
      "expire" timestamp(6) NOT NULL
    );
  `);
  pgm.sql(`CREATE INDEX "IDX_session_expire" ON "session" ("expire");`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("session", { ifExists: true });
  pgm.dropTable("case_archive_entries", { ifExists: true });
  pgm.dropTable("course_progress", { ifExists: true });
  pgm.dropTable("learning_resources", { ifExists: true });
  pgm.dropTable("document_versions", { ifExists: true });
  pgm.dropTable("documents", { ifExists: true });
  pgm.dropTable("review_decisions", { ifExists: true });
  pgm.dropTable("weekly_submissions", { ifExists: true });
  pgm.dropTable("logbook_entries", { ifExists: true });
  pgm.dropTable("audit_events", { ifExists: true });
  pgm.dropTable("users", { ifExists: true });
  pgm.dropTable("roles", { ifExists: true });
  pgm.dropTable("units", { ifExists: true });
}
