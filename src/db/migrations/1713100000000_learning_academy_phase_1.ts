import type { MigrationBuilder } from "node-pg-migrate";

export const shorthands = undefined;

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("academy_programs", {
    id: { type: "uuid", primaryKey: true },
    unit_id: { type: "uuid", notNull: true, references: "units", onDelete: "cascade" },
    title: { type: "varchar(255)", notNull: true },
    slug: { type: "varchar(160)", notNull: true },
    description: { type: "text", notNull: true, default: "" },
    status: { type: "varchar(32)", notNull: true, default: "draft" },
    created_by_user_id: { type: "uuid", references: "users", onDelete: "set null" },
    published_at: { type: "timestamp" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.addConstraint("academy_programs", "academy_programs_unit_slug_unique", {
    unique: ["unit_id", "slug"]
  });

  pgm.createTable("academy_chapters", {
    id: { type: "uuid", primaryKey: true },
    program_id: { type: "uuid", notNull: true, references: "academy_programs", onDelete: "cascade" },
    title: { type: "varchar(255)", notNull: true },
    summary: { type: "text", notNull: true, default: "" },
    slug: { type: "varchar(160)", notNull: true },
    position: { type: "integer", notNull: true, default: 0 },
    status: { type: "varchar(32)", notNull: true, default: "draft" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.addConstraint("academy_chapters", "academy_chapters_program_slug_unique", {
    unique: ["program_id", "slug"]
  });

  pgm.createTable("academy_subchapters", {
    id: { type: "uuid", primaryKey: true },
    chapter_id: { type: "uuid", notNull: true, references: "academy_chapters", onDelete: "cascade" },
    title: { type: "varchar(255)", notNull: true },
    summary: { type: "text", notNull: true, default: "" },
    slug: { type: "varchar(160)", notNull: true },
    position: { type: "integer", notNull: true, default: 0 },
    status: { type: "varchar(32)", notNull: true, default: "draft" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.addConstraint("academy_subchapters", "academy_subchapters_chapter_slug_unique", {
    unique: ["chapter_id", "slug"]
  });

  pgm.createTable("academy_items", {
    id: { type: "uuid", primaryKey: true },
    subchapter_id: { type: "uuid", notNull: true, references: "academy_subchapters", onDelete: "cascade" },
    learning_resource_id: { type: "uuid", notNull: true, references: "learning_resources", onDelete: "cascade" },
    item_type: { type: "varchar(64)", notNull: true },
    title_override: { type: "varchar(255)" },
    position: { type: "integer", notNull: true, default: 0 },
    is_required: { type: "boolean", notNull: true, default: true },
    is_assessment: { type: "boolean", notNull: true, default: false },
    estimated_minutes: { type: "integer", notNull: true, default: 0 },
    status: { type: "varchar(32)", notNull: true, default: "draft" },
    created_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") },
    updated_at: { type: "timestamp", notNull: true, default: pgm.func("current_timestamp") }
  });
  pgm.addConstraint("academy_items", "academy_items_subchapter_resource_unique", {
    unique: ["subchapter_id", "learning_resource_id"]
  });

  pgm.addIndex("academy_programs", ["unit_id", "status"], {
    name: "idx_academy_programs_unit_status"
  });
  pgm.addIndex("academy_chapters", ["program_id", "slug"], {
    name: "idx_academy_chapters_program_slug"
  });
  pgm.addIndex("academy_chapters", ["program_id", "position"], {
    name: "idx_academy_chapters_program_position"
  });
  pgm.addIndex("academy_subchapters", ["chapter_id", "slug"], {
    name: "idx_academy_subchapters_chapter_slug"
  });
  pgm.addIndex("academy_subchapters", ["chapter_id", "position"], {
    name: "idx_academy_subchapters_chapter_position"
  });
  pgm.addIndex("academy_items", ["subchapter_id", "learning_resource_id"], {
    name: "idx_academy_items_subchapter_resource_unique"
  });
  pgm.addIndex("academy_items", ["subchapter_id", "position"], {
    name: "idx_academy_items_subchapter_position"
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("academy_items", ["subchapter_id", "position"], {
    ifExists: true,
    name: "idx_academy_items_subchapter_position"
  });
  pgm.dropIndex("academy_items", ["subchapter_id", "learning_resource_id"], {
    ifExists: true,
    name: "idx_academy_items_subchapter_resource_unique"
  });
  pgm.dropIndex("academy_subchapters", ["chapter_id", "position"], {
    ifExists: true,
    name: "idx_academy_subchapters_chapter_position"
  });
  pgm.dropIndex("academy_subchapters", ["chapter_id", "slug"], {
    ifExists: true,
    name: "idx_academy_subchapters_chapter_slug"
  });
  pgm.dropIndex("academy_chapters", ["program_id", "position"], {
    ifExists: true,
    name: "idx_academy_chapters_program_position"
  });
  pgm.dropIndex("academy_chapters", ["program_id", "slug"], {
    ifExists: true,
    name: "idx_academy_chapters_program_slug"
  });
  pgm.dropIndex("academy_programs", ["unit_id", "status"], {
    ifExists: true,
    name: "idx_academy_programs_unit_status"
  });

  pgm.dropConstraint("academy_items", "academy_items_subchapter_resource_unique", { ifExists: true });
  pgm.dropConstraint("academy_subchapters", "academy_subchapters_chapter_slug_unique", { ifExists: true });
  pgm.dropConstraint("academy_chapters", "academy_chapters_program_slug_unique", { ifExists: true });
  pgm.dropConstraint("academy_programs", "academy_programs_unit_slug_unique", { ifExists: true });

  pgm.dropTable("academy_items", { ifExists: true });
  pgm.dropTable("academy_subchapters", { ifExists: true });
  pgm.dropTable("academy_chapters", { ifExists: true });
  pgm.dropTable("academy_programs", { ifExists: true });
}
