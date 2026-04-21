import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("learning_resources", {
    description: { type: "text", notNull: true, default: "" },
    h5p_content_id: { type: "text" },
    metadata_json: { type: "jsonb", notNull: true, default: "{}" }
  });

  pgm.createTable("h5p_content", {
    content_id: { type: "text", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    title: { type: "varchar(255)", notNull: true },
    library_name: { type: "varchar(255)", notNull: true },
    parameters_json: { type: "jsonb", notNull: true, default: "{}" },
    metadata_json: { type: "jsonb", notNull: true, default: "{}" },
    created_by_user_id: { type: "uuid", references: "users", onDelete: "set null" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("h5p_content_aliases", {
    alias_content_id: { type: "text", primaryKey: true },
    canonical_content_id: { type: "text", notNull: true, references: "h5p_content", onDelete: "cascade" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.createTable("h5p_xapi_events", {
    id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    user_id: { type: "uuid", references: "users", onDelete: "set null" },
    learning_resource_id: { type: "uuid", references: "learning_resources", onDelete: "set null" },
    h5p_content_id: { type: "text", notNull: true },
    verb: { type: "varchar(255)", notNull: true },
    result_json: { type: "jsonb", notNull: true, default: "{}" },
    statement_json: { type: "jsonb", notNull: true, default: "{}" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });

  pgm.addIndex("learning_resources", ["unit_id", "h5p_content_id"], {
    name: "learning_resources_unit_h5p_idx"
  });
  pgm.addConstraint("learning_resources", "learning_resources_h5p_content_unique", {
    unique: ["unit_id", "h5p_content_id"]
  });
  pgm.addIndex("h5p_content", ["unit_id", "updated_at"], { name: "h5p_content_unit_updated_idx" });
  pgm.addIndex("h5p_xapi_events", ["h5p_content_id", "created_at"], { name: "h5p_xapi_content_created_idx" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("h5p_xapi_events", ["h5p_content_id", "created_at"], { ifExists: true, name: "h5p_xapi_content_created_idx" });
  pgm.dropIndex("h5p_content", ["unit_id", "updated_at"], { ifExists: true, name: "h5p_content_unit_updated_idx" });
  pgm.dropConstraint("learning_resources", "learning_resources_h5p_content_unique", { ifExists: true });
  pgm.dropIndex("learning_resources", ["unit_id", "h5p_content_id"], { ifExists: true, name: "learning_resources_unit_h5p_idx" });
  pgm.dropTable("h5p_xapi_events", { ifExists: true });
  pgm.dropTable("h5p_content_aliases", { ifExists: true });
  pgm.dropTable("h5p_content", { ifExists: true });
  pgm.dropColumns("learning_resources", ["description", "h5p_content_id", "metadata_json"], { ifExists: true });
}
