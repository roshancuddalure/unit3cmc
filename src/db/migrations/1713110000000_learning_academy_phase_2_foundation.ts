import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("academy_item_attempts", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    academy_item_id: { type: "uuid", notNull: true, references: "academy_items", onDelete: "cascade" },
    learning_resource_id: { type: "uuid", notNull: true, references: "learning_resources", onDelete: "cascade" },
    h5p_content_id: { type: "text" },
    source_type: { type: "varchar(32)", notNull: true, default: "manual" },
    attempt_kind: { type: "varchar(32)", notNull: true, default: "manual_progress" },
    verb: { type: "varchar(255)", notNull: true, default: "manual" },
    progress_status: { type: "varchar(32)", notNull: true, default: "not_started" },
    score_raw: { type: "numeric(10,2)" },
    score_max: { type: "numeric(10,2)" },
    score_scaled: { type: "numeric(10,4)" },
    passed: { type: "boolean" },
    time_spent_seconds: { type: "integer" },
    result_json: { type: "jsonb", notNull: true, default: "{}" },
    statement_json: { type: "jsonb", notNull: true, default: "{}" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("academy_item_progress", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    user_id: { type: "uuid", notNull: true, references: "users", onDelete: "cascade" },
    academy_item_id: { type: "uuid", notNull: true, references: "academy_items", onDelete: "cascade" },
    learning_resource_id: { type: "uuid", notNull: true, references: "learning_resources", onDelete: "cascade" },
    status: { type: "varchar(32)", notNull: true, default: "not_started" },
    latest_attempt_at: { type: "timestamp" },
    latest_attempt_source: { type: "varchar(32)", notNull: true, default: "manual" },
    attempt_count: { type: "integer", notNull: true, default: 0 },
    latest_score_scaled: { type: "numeric(10,4)" },
    best_score_scaled: { type: "numeric(10,4)" },
    passed_attempt_count: { type: "integer", notNull: true, default: 0 },
    first_passed_at: { type: "timestamp" },
    completed_at: { type: "timestamp" },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.addConstraint("academy_item_progress", "academy_item_progress_user_item_unique", {
    unique: ["user_id", "academy_item_id"]
  });

  pgm.addIndex("academy_item_attempts", ["user_id", "academy_item_id", "created_at"], {
    name: "idx_academy_item_attempts_user_item_created"
  });
  pgm.addIndex("academy_item_attempts", ["unit_id", "user_id", "created_at"], {
    name: "idx_academy_item_attempts_unit_user_created"
  });
  pgm.addIndex("academy_item_progress", ["unit_id", "user_id"], {
    name: "idx_academy_item_progress_unit_user"
  });
  pgm.addIndex("academy_item_progress", ["unit_id", "academy_item_id"], {
    name: "idx_academy_item_progress_unit_item"
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("academy_item_progress", ["unit_id", "academy_item_id"], {
    ifExists: true,
    name: "idx_academy_item_progress_unit_item"
  });
  pgm.dropIndex("academy_item_progress", ["unit_id", "user_id"], {
    ifExists: true,
    name: "idx_academy_item_progress_unit_user"
  });
  pgm.dropIndex("academy_item_attempts", ["unit_id", "user_id", "created_at"], {
    ifExists: true,
    name: "idx_academy_item_attempts_unit_user_created"
  });
  pgm.dropIndex("academy_item_attempts", ["user_id", "academy_item_id", "created_at"], {
    ifExists: true,
    name: "idx_academy_item_attempts_user_item_created"
  });
  pgm.dropConstraint("academy_item_progress", "academy_item_progress_user_item_unique", { ifExists: true });
  pgm.dropTable("academy_item_progress", { ifExists: true });
  pgm.dropTable("academy_item_attempts", { ifExists: true });
}
