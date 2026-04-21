import { Client } from "pg";
import { loadEnv } from "../config/env";

function parseDatabaseUrl(databaseUrl: string) {
  const url = new URL(databaseUrl);
  const database = url.pathname.replace(/^\//, "");
  return {
    database,
    adminUrl: `${url.protocol}//${url.username}:${url.password}@${url.host}/postgres`
  };
}

function buildDatabaseScopedUrl(baseUrl: string, database: string): string {
  const url = new URL(baseUrl);
  url.pathname = `/${database}`;
  return url.toString();
}

async function ensureDatabaseExists(adminUrl: string, database: string): Promise<void> {
  const client = new Client({ connectionString: adminUrl });
  await client.connect();

  const exists = await client.query("select 1 from pg_database where datname = $1", [database]);
  if (exists.rowCount === 0) {
    await client.query(`create database "${database.replace(/"/g, "\"\"")}"`);
  }

  await client.end();
}

async function migrate(): Promise<void> {
  const env = loadEnv();
  const { adminUrl: derivedAdminUrl, database } = parseDatabaseUrl(env.DATABASE_URL);
  const adminUrl = env.DATABASE_ADMIN_URL ?? derivedAdminUrl;
  const adminDatabaseUrl = buildDatabaseScopedUrl(adminUrl, database);

  await ensureDatabaseExists(adminUrl, database);

  const client = new Client({ connectionString: adminDatabaseUrl });
  await client.connect();

  await client.query(`create extension if not exists pgcrypto;`);

  await client.query(`
    create table if not exists units (
      id uuid primary key,
      code varchar(32) not null unique,
      name varchar(255) not null,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists roles (
      id uuid primary key,
      key varchar(64) not null unique,
      name varchar(120) not null
    );

    create table if not exists users (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      role_id uuid not null references roles(id),
      username varchar(120) not null unique,
      name varchar(255) not null,
      display_name varchar(255),
      phone varchar(32),
      designation varchar(120),
      department varchar(120),
      training_year varchar(32),
      employee_or_student_id varchar(64),
      joining_date date,
      notes text not null default '',
      email varchar(255) not null unique,
      password_hash text not null,
      status varchar(24) not null default 'pending',
      can_review_cases boolean not null default false,
      must_change_password boolean not null default false,
      approved_by_user_id uuid references users(id) on delete set null,
      approved_at timestamp,
      suspended_by_user_id uuid references users(id) on delete set null,
      suspended_at timestamp,
      suspension_reason text not null default '',
      archived_by_user_id uuid references users(id) on delete set null,
      archived_at timestamp,
      archive_reason text not null default '',
      created_at timestamp not null default current_timestamp
    );

    create table if not exists audit_events (
      id uuid primary key default gen_random_uuid(),
      actor_user_id uuid references users(id) on delete set null,
      action varchar(255) not null,
      entity_type varchar(120) not null,
      entity_id text not null,
      metadata jsonb default '{}'::jsonb,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entries (
      id uuid primary key,
      user_id uuid not null references users(id) on delete cascade,
      unit_id uuid not null references units(id) on delete cascade,
      case_number integer,
      activity_date date not null,
      procedure_name varchar(255) not null,
      patient_reference varchar(120),
      clinical_domain varchar(120) not null default 'general_anaesthesia',
      procedure_category varchar(120) not null default 'other',
      specialty_area varchar(120) not null default 'general_surgery',
      location varchar(120) not null default 'operating_theatre',
      urgency varchar(64) not null default 'elective',
      patient_age_band varchar(64) not null default 'adult_18_64',
      asa_physical_status varchar(32) not null default 'unknown',
      anaesthesia_technique varchar(120) not null default 'general_anaesthesia',
      supervision_level varchar(120) not null,
      participation_level varchar(120) not null default 'performed_under_supervision',
      complexity_level varchar(64) not null default 'routine',
      duration_minutes integer,
      had_complication boolean not null default false,
      complication_summary text not null default '',
      reflection_notes text not null default '',
      case_type varchar(32) not null default 'Elective',
      anaesthesia_unit varchar(64) not null default 'Unit 3',
      ot_number varchar(64) not null default '',
      surgical_department text not null default '',
      surgery_start_time time,
      surgery_end_time time,
      age_years integer,
      gender varchar(32) not null default '',
      bmi numeric(6,2),
      anaesthetic_planned varchar(120) not null default '',
      airway_management varchar(120) not null default '',
      scopy_technique varchar(120) not null default '',
      intraoperative_events text not null default '',
      notes text not null default '',
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_comorbidities (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      label varchar(160) not null,
      details text not null default '',
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_procedures (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      label varchar(160) not null,
      details text not null default '',
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_analgesia (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      label varchar(160) not null,
      details text not null default '',
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_postoperative_care (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      label varchar(160) not null,
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_learning_points (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      point_text text not null,
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_involved_users (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      user_id uuid not null references users(id) on delete cascade,
      position integer not null default 0,
      created_at timestamp not null default current_timestamp,
      unique(logbook_entry_id, user_id)
    );

    create table if not exists weekly_submissions (
      id uuid primary key,
      user_id uuid not null references users(id) on delete cascade,
      unit_id uuid not null references units(id) on delete cascade,
      week_start_date date not null,
      week_end_date date not null,
      status varchar(32) not null default 'submitted',
      created_at timestamp not null default current_timestamp
    );

    create table if not exists review_decisions (
      id uuid primary key,
      weekly_submission_id uuid not null references weekly_submissions(id) on delete cascade,
      reviewer_id uuid not null references users(id) on delete cascade,
      decision varchar(32) not null,
      comments text not null default '',
      created_at timestamp not null default current_timestamp
    );

    create table if not exists documents (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      owner_user_id uuid references users(id) on delete set null,
      title varchar(255) not null,
      category varchar(120) not null,
      visibility varchar(64) not null default 'unit_internal',
      created_at timestamp not null default current_timestamp
    );

    create table if not exists document_versions (
      id uuid primary key,
      document_id uuid not null references documents(id) on delete cascade,
      version_number integer not null,
      version_notes text not null default '',
      storage_key text not null,
      original_file_name text not null,
      created_by_user_id uuid references users(id) on delete set null,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists learning_resources (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      created_by_user_id uuid references users(id) on delete set null,
      title varchar(255) not null,
      description text not null default '',
      resource_type varchar(120) not null,
      source_url text not null,
      h5p_content_id text,
      metadata_json jsonb not null default '{}'::jsonb,
      status varchar(32) not null default 'draft',
      created_at timestamp not null default current_timestamp
    );

    create table if not exists course_progress (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      user_id uuid not null references users(id) on delete cascade,
      learning_resource_id uuid not null references learning_resources(id) on delete cascade,
      status varchar(32) not null default 'not_started',
      updated_at timestamp not null default current_timestamp,
      unique(user_id, learning_resource_id)
    );

    create table if not exists academy_programs (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      title varchar(255) not null,
      slug varchar(160) not null,
      description text not null default '',
      status varchar(32) not null default 'draft',
      created_by_user_id uuid references users(id) on delete set null,
      published_at timestamp,
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp,
      unique(unit_id, slug)
    );

    create table if not exists academy_cohorts (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      created_by_user_id uuid references users(id) on delete set null,
      title varchar(255) not null,
      slug varchar(160) not null,
      audience_kind varchar(32) not null default 'mixed',
      description text not null default '',
      status varchar(32) not null default 'active',
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp,
      unique(unit_id, slug)
    );

    create table if not exists academy_cohort_members (
      cohort_id uuid not null references academy_cohorts(id) on delete cascade,
      user_id uuid not null references users(id) on delete cascade,
      created_at timestamp not null default current_timestamp,
      primary key (cohort_id, user_id)
    );

    create table if not exists academy_program_audiences (
      id uuid primary key,
      program_id uuid not null references academy_programs(id) on delete cascade,
      access_scope varchar(32) not null,
      role_key varchar(64),
      cohort_id uuid references academy_cohorts(id) on delete set null,
      user_id uuid references users(id) on delete set null,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists academy_chapters (
      id uuid primary key,
      program_id uuid not null references academy_programs(id) on delete cascade,
      title varchar(255) not null,
      summary text not null default '',
      slug varchar(160) not null,
      position integer not null default 0,
      status varchar(32) not null default 'draft',
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp,
      unique(program_id, slug)
    );

    create table if not exists academy_subchapters (
      id uuid primary key,
      chapter_id uuid not null references academy_chapters(id) on delete cascade,
      title varchar(255) not null,
      summary text not null default '',
      slug varchar(160) not null,
      position integer not null default 0,
      status varchar(32) not null default 'draft',
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp,
      unique(chapter_id, slug)
    );

    create table if not exists academy_items (
      id uuid primary key,
      subchapter_id uuid not null references academy_subchapters(id) on delete cascade,
      learning_resource_id uuid not null references learning_resources(id) on delete cascade,
      item_type varchar(64) not null,
      title_override varchar(255),
      position integer not null default 0,
      is_required boolean not null default true,
      is_assessment boolean not null default false,
      estimated_minutes integer not null default 0,
      status varchar(32) not null default 'draft',
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp,
      unique(subchapter_id, learning_resource_id)
    );

    create table if not exists academy_item_attempts (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      user_id uuid not null references users(id) on delete cascade,
      academy_item_id uuid not null references academy_items(id) on delete cascade,
      learning_resource_id uuid not null references learning_resources(id) on delete cascade,
      h5p_content_id text,
      source_type varchar(32) not null default 'manual',
      attempt_kind varchar(32) not null default 'manual_progress',
      verb varchar(255) not null default 'manual',
      progress_status varchar(32) not null default 'not_started',
      score_raw numeric(10, 2),
      score_max numeric(10, 2),
      score_scaled numeric(10, 4),
      passed boolean,
      time_spent_seconds integer,
      result_json jsonb not null default '{}'::jsonb,
      statement_json jsonb not null default '{}'::jsonb,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists academy_item_progress (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      user_id uuid not null references users(id) on delete cascade,
      academy_item_id uuid not null references academy_items(id) on delete cascade,
      learning_resource_id uuid not null references learning_resources(id) on delete cascade,
      status varchar(32) not null default 'not_started',
      latest_attempt_at timestamp,
      latest_attempt_source varchar(32) not null default 'manual',
      attempt_count integer not null default 0,
      latest_score_scaled numeric(10, 4),
      best_score_scaled numeric(10, 4),
      passed_attempt_count integer not null default 0,
      first_passed_at timestamp,
      completed_at timestamp,
      updated_at timestamp not null default current_timestamp,
      unique(user_id, academy_item_id)
    );

    create table if not exists case_archive_entries (
      id uuid primary key,
      unit_id uuid not null references units(id) on delete cascade,
      created_by_user_id uuid references users(id) on delete set null,
      title varchar(255) not null,
      subtitle varchar(255),
      summary text not null,
      learning_points text not null default '',
      why_this_case_matters text not null default '',
      key_decision_points text not null default '',
      what_went_well text not null default '',
      what_could_improve text not null default '',
      take_home_points text not null default '',
      specialty_area varchar(120) not null default 'other',
      anaesthesia_technique varchar(120) not null default 'other',
      urgency varchar(64) not null default 'elective',
      patient_age_band varchar(64) not null default 'not_recorded',
      complexity_level varchar(64) not null default 'routine',
      setting varchar(120) not null default 'other',
      had_critical_event boolean not null default false,
      status varchar(32) not null default 'published',
      tags text[] not null default '{}',
      created_at timestamp not null default current_timestamp
    );

    create table if not exists case_archive_contributors (
      case_archive_entry_id uuid not null references case_archive_entries(id) on delete cascade,
      user_id uuid not null references users(id) on delete cascade,
      created_at timestamp not null default current_timestamp,
      primary key (case_archive_entry_id, user_id)
    );

    create table if not exists case_review_comments (
      id uuid primary key,
      case_archive_entry_id uuid not null references case_archive_entries(id) on delete cascade,
      author_user_id uuid references users(id) on delete set null,
      comment text not null,
      comment_type varchar(32) not null default 'note',
      created_at timestamp not null default current_timestamp
    );

    create table if not exists case_related_documents (
      case_archive_entry_id uuid not null references case_archive_entries(id) on delete cascade,
      document_id uuid not null references documents(id) on delete cascade,
      created_at timestamp not null default current_timestamp,
      primary key (case_archive_entry_id, document_id)
    );

    create table if not exists case_related_learning_resources (
      case_archive_entry_id uuid not null references case_archive_entries(id) on delete cascade,
      learning_resource_id uuid not null references learning_resources(id) on delete cascade,
      created_at timestamp not null default current_timestamp,
      primary key (case_archive_entry_id, learning_resource_id)
    );

    create table if not exists session (
      sid varchar not null primary key,
      sess json not null,
      expire timestamp(6) not null
    );

    create table if not exists h5p_content (
      content_id text primary key,
      unit_id uuid not null references units(id) on delete cascade,
      title varchar(255) not null,
      library_name varchar(255) not null,
      parameters_json jsonb not null default '{}'::jsonb,
      metadata_json jsonb not null default '{}'::jsonb,
      created_by_user_id uuid references users(id) on delete set null,
      created_at timestamp not null default current_timestamp,
      updated_at timestamp not null default current_timestamp
    );

    create table if not exists h5p_content_aliases (
      alias_content_id text primary key,
      canonical_content_id text not null references h5p_content(content_id) on delete cascade,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists h5p_xapi_events (
      id uuid primary key default gen_random_uuid(),
      unit_id uuid not null references units(id) on delete cascade,
      user_id uuid references users(id) on delete set null,
      learning_resource_id uuid references learning_resources(id) on delete set null,
      h5p_content_id text not null,
      verb varchar(255) not null,
      result_json jsonb not null default '{}'::jsonb,
      statement_json jsonb not null default '{}'::jsonb,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists profile_change_requests (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references users(id) on delete cascade,
      requested_fields jsonb not null default '{}'::jsonb,
      status varchar(32) not null default 'pending',
      reviewed_by_user_id uuid references users(id) on delete set null,
      reviewed_at timestamp,
      reviewer_notes text not null default '',
      created_at timestamp not null default current_timestamp
    );

    create index if not exists idx_profile_change_requests_user on profile_change_requests(user_id, created_at desc);
    create index if not exists idx_profile_change_requests_status on profile_change_requests(status, created_at desc);

    create index if not exists idx_session_expire on session (expire);
    create index if not exists idx_h5p_content_unit_updated on h5p_content(unit_id, updated_at desc);
    create index if not exists idx_h5p_xapi_content_created on h5p_xapi_events(h5p_content_id, created_at desc);
  `);

  await client.query(`
    insert into roles (id, key, name)
    values
      (gen_random_uuid(), 'super_admin', 'Super Admin'),
      (gen_random_uuid(), 'unit_admin_or_faculty', 'Unit Admin / Chief'),
      (gen_random_uuid(), 'faculty', 'Faculty'),
      (gen_random_uuid(), 'postgraduate', 'Postgraduate'),
      (gen_random_uuid(), 'reviewer', 'Reviewer')
    on conflict (key)
    do update set name = excluded.name;
  `);

  await client.query(`
    alter table users add column if not exists display_name varchar(255);
    alter table users add column if not exists phone varchar(32);
    alter table users add column if not exists designation varchar(120);
    alter table users add column if not exists department varchar(120);
    alter table users add column if not exists training_year varchar(32);
    alter table users add column if not exists employee_or_student_id varchar(64);
    alter table users add column if not exists joining_date date;
    alter table users add column if not exists notes text not null default '';
    alter table users add column if not exists status varchar(24) not null default 'pending';
    alter table users add column if not exists can_review_cases boolean not null default false;
    alter table users add column if not exists must_change_password boolean not null default false;
    alter table users add column if not exists approved_by_user_id uuid references users(id) on delete set null;
    alter table users add column if not exists approved_at timestamp;
    alter table users add column if not exists suspended_by_user_id uuid references users(id) on delete set null;
    alter table users add column if not exists suspended_at timestamp;
    alter table users add column if not exists suspension_reason text not null default '';
    alter table users add column if not exists archived_by_user_id uuid references users(id) on delete set null;
    alter table users add column if not exists archived_at timestamp;
    alter table users add column if not exists archive_reason text not null default '';
    alter table logbook_entries add column if not exists clinical_domain varchar(120) not null default 'general_anaesthesia';
    alter table logbook_entries add column if not exists procedure_category varchar(120) not null default 'other';
    alter table logbook_entries add column if not exists specialty_area varchar(120) not null default 'general_surgery';
    alter table logbook_entries add column if not exists location varchar(120) not null default 'operating_theatre';
    alter table logbook_entries add column if not exists urgency varchar(64) not null default 'elective';
    alter table logbook_entries add column if not exists patient_age_band varchar(64) not null default 'adult_18_64';
    alter table logbook_entries add column if not exists asa_physical_status varchar(32) not null default 'unknown';
    alter table logbook_entries add column if not exists anaesthesia_technique varchar(120) not null default 'general_anaesthesia';
    alter table logbook_entries add column if not exists participation_level varchar(120) not null default 'performed_under_supervision';
    alter table logbook_entries add column if not exists complexity_level varchar(64) not null default 'routine';
    alter table logbook_entries add column if not exists duration_minutes integer;
    alter table logbook_entries add column if not exists had_complication boolean not null default false;
    alter table logbook_entries add column if not exists complication_summary text not null default '';
    alter table logbook_entries add column if not exists reflection_notes text not null default '';
    alter table logbook_entries add column if not exists case_number integer;
    alter table logbook_entries add column if not exists case_type varchar(32) not null default 'Elective';
    alter table logbook_entries add column if not exists anaesthesia_unit varchar(64) not null default 'Unit 3';
    alter table logbook_entries add column if not exists ot_number varchar(64) not null default '';
    alter table logbook_entries add column if not exists surgical_department text not null default '';
    alter table logbook_entries add column if not exists surgery_start_time time;
    alter table logbook_entries add column if not exists surgery_end_time time;
    alter table logbook_entries add column if not exists age_years integer;
    alter table logbook_entries add column if not exists gender varchar(32) not null default '';
    alter table logbook_entries add column if not exists bmi numeric(6,2);
    alter table logbook_entries add column if not exists anaesthetic_planned varchar(120) not null default '';
    alter table logbook_entries add column if not exists airway_management varchar(120) not null default '';
    alter table logbook_entries add column if not exists scopy_technique varchar(120) not null default '';
    alter table logbook_entries add column if not exists intraoperative_events text not null default '';

    create table if not exists logbook_entry_comorbidities (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      label varchar(160) not null,
      details text not null default '',
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_procedures (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      label varchar(160) not null,
      details text not null default '',
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_analgesia (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      label varchar(160) not null,
      details text not null default '',
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_postoperative_care (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      label varchar(160) not null,
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_learning_points (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      point_text text not null,
      position integer not null default 0,
      created_at timestamp not null default current_timestamp
    );

    create table if not exists logbook_entry_involved_users (
      id uuid primary key,
      logbook_entry_id uuid not null references logbook_entries(id) on delete cascade,
      user_id uuid not null references users(id) on delete cascade,
      position integer not null default 0,
      created_at timestamp not null default current_timestamp,
      unique(logbook_entry_id, user_id)
    );

    update users
    set
      display_name = coalesce(display_name, name),
      approved_at = coalesce(approved_at, created_at)
    where display_name is null;

    update users
    set
      status = 'active',
      approved_at = coalesce(approved_at, created_at)
    where role_id in (select id from roles where key = 'super_admin');

    update logbook_entries
    set reflection_notes = coalesce(nullif(reflection_notes, ''), notes, '')
    where reflection_notes = '';

    update logbook_entries
    set patient_reference = null
    where patient_reference is not null and patient_reference <> '';

    with numbered_entries as (
      select
        id,
        row_number() over (
          partition by user_id
          order by activity_date asc, created_at asc, id asc
        ) as generated_case_number
      from logbook_entries
    )
    update logbook_entries le
    set case_number = ne.generated_case_number
    from numbered_entries ne
    where le.id = ne.id
      and le.case_number is null;

    alter table documents add column if not exists document_type varchar(64) not null default 'sop';
    alter table documents add column if not exists subtitle varchar(255);
    alter table documents add column if not exists scope_area varchar(120);
    alter table documents add column if not exists status varchar(32) not null default 'draft';
    alter table documents add column if not exists effective_date date;
    alter table documents add column if not exists review_due_date date;
    alter table documents add column if not exists published_at timestamp;
    alter table documents add column if not exists archived_at timestamp;
    alter table documents add column if not exists updated_at timestamp not null default current_timestamp;
    alter table documents add column if not exists current_version_id uuid;

    alter table document_versions add column if not exists content_html text not null default '';
    alter table document_versions add column if not exists change_summary text not null default '';
    alter table document_versions add column if not exists submitted_for_review_at timestamp;
    alter table document_versions add column if not exists approved_at timestamp;

    create table if not exists sop_review_events (
      id uuid primary key,
      document_id uuid not null references documents(id) on delete cascade,
      version_id uuid references document_versions(id) on delete set null,
      actor_user_id uuid references users(id) on delete set null,
      decision varchar(32) not null,
      comments text not null default '',
      created_at timestamp not null default current_timestamp
    );

    create index if not exists idx_documents_unit_status on documents(unit_id, status);
    create index if not exists idx_documents_unit_updated on documents(unit_id, updated_at desc);
    create index if not exists idx_documents_title on documents(title);
    alter table case_archive_entries add column if not exists subtitle varchar(255);
    alter table case_archive_entries add column if not exists learning_points text not null default '';
    alter table case_archive_entries add column if not exists why_this_case_matters text not null default '';
    alter table case_archive_entries add column if not exists key_decision_points text not null default '';
    alter table case_archive_entries add column if not exists what_went_well text not null default '';
    alter table case_archive_entries add column if not exists what_could_improve text not null default '';
    alter table case_archive_entries add column if not exists take_home_points text not null default '';
    alter table case_archive_entries add column if not exists specialty_area varchar(120) not null default 'other';
    alter table case_archive_entries add column if not exists anaesthesia_technique varchar(120) not null default 'other';
    alter table case_archive_entries add column if not exists urgency varchar(64) not null default 'elective';
    alter table case_archive_entries add column if not exists patient_age_band varchar(64) not null default 'not_recorded';
    alter table case_archive_entries add column if not exists complexity_level varchar(64) not null default 'routine';
    alter table case_archive_entries add column if not exists setting varchar(120) not null default 'other';
    alter table case_archive_entries add column if not exists had_critical_event boolean not null default false;
    alter table case_archive_entries add column if not exists is_featured boolean not null default false;
    alter table case_archive_entries add column if not exists status varchar(32) not null default 'published';
    alter table learning_resources add column if not exists description text not null default '';
    alter table learning_resources add column if not exists h5p_content_id text;
    alter table learning_resources add column if not exists metadata_json jsonb not null default '{}'::jsonb;
    alter table academy_programs add column if not exists description text not null default '';
    alter table academy_programs add column if not exists status varchar(32) not null default 'draft';
    alter table academy_programs add column if not exists created_by_user_id uuid references users(id) on delete set null;
    alter table academy_programs add column if not exists published_at timestamp;
    alter table academy_programs add column if not exists updated_at timestamp not null default current_timestamp;
    alter table academy_cohorts add column if not exists created_by_user_id uuid references users(id) on delete set null;
    alter table academy_cohorts add column if not exists title varchar(255) not null default 'Untitled cohort';
    alter table academy_cohorts add column if not exists slug varchar(160) not null default 'untitled-cohort';
    alter table academy_cohorts add column if not exists audience_kind varchar(32) not null default 'mixed';
    alter table academy_cohorts add column if not exists description text not null default '';
    alter table academy_cohorts add column if not exists status varchar(32) not null default 'active';
    alter table academy_cohorts add column if not exists updated_at timestamp not null default current_timestamp;
    alter table academy_program_audiences add column if not exists access_scope varchar(32) not null default 'open';
    alter table academy_program_audiences add column if not exists role_key varchar(64);
    alter table academy_program_audiences add column if not exists cohort_id uuid references academy_cohorts(id) on delete set null;
    alter table academy_program_audiences add column if not exists user_id uuid references users(id) on delete set null;
    alter table academy_chapters add column if not exists summary text not null default '';
    alter table academy_chapters add column if not exists overview text not null default '';
    alter table academy_chapters add column if not exists position integer not null default 0;
    alter table academy_chapters add column if not exists status varchar(32) not null default 'draft';
    alter table academy_chapters add column if not exists updated_at timestamp not null default current_timestamp;
    alter table academy_subchapters add column if not exists summary text not null default '';
    alter table academy_subchapters add column if not exists overview text not null default '';
    alter table academy_subchapters add column if not exists position integer not null default 0;
    alter table academy_subchapters add column if not exists status varchar(32) not null default 'draft';
    alter table academy_subchapters add column if not exists updated_at timestamp not null default current_timestamp;
    alter table academy_items add column if not exists item_type varchar(64) not null default 'resource';
    alter table academy_items add column if not exists title_override varchar(255);
    alter table academy_items add column if not exists position integer not null default 0;
    alter table academy_items add column if not exists is_required boolean not null default true;
    alter table academy_items add column if not exists is_assessment boolean not null default false;
    alter table academy_items add column if not exists estimated_minutes integer not null default 0;
    alter table academy_items add column if not exists status varchar(32) not null default 'draft';
    alter table academy_items add column if not exists updated_at timestamp not null default current_timestamp;
    alter table academy_item_attempts add column if not exists h5p_content_id text;
    alter table academy_item_attempts add column if not exists source_type varchar(32) not null default 'manual';
    alter table academy_item_attempts add column if not exists attempt_kind varchar(32) not null default 'manual_progress';
    alter table academy_item_attempts add column if not exists verb varchar(255) not null default 'manual';
    alter table academy_item_attempts add column if not exists progress_status varchar(32) not null default 'not_started';
    alter table academy_item_attempts add column if not exists score_raw numeric(10, 2);
    alter table academy_item_attempts add column if not exists score_max numeric(10, 2);
    alter table academy_item_attempts add column if not exists score_scaled numeric(10, 4);
    alter table academy_item_attempts add column if not exists passed boolean;
    alter table academy_item_attempts add column if not exists time_spent_seconds integer;
    alter table academy_item_attempts add column if not exists result_json jsonb not null default '{}'::jsonb;
    alter table academy_item_attempts add column if not exists statement_json jsonb not null default '{}'::jsonb;
    alter table academy_item_progress add column if not exists status varchar(32) not null default 'not_started';
    alter table academy_item_progress add column if not exists latest_attempt_at timestamp;
    alter table academy_item_progress add column if not exists latest_attempt_source varchar(32) not null default 'manual';
    alter table academy_item_progress add column if not exists attempt_count integer not null default 0;
    alter table academy_item_progress add column if not exists latest_score_scaled numeric(10, 4);
    alter table academy_item_progress add column if not exists best_score_scaled numeric(10, 4);
    alter table academy_item_progress add column if not exists passed_attempt_count integer not null default 0;
    alter table academy_item_progress add column if not exists first_passed_at timestamp;
    alter table academy_item_progress add column if not exists completed_at timestamp;
    alter table academy_item_progress add column if not exists updated_at timestamp not null default current_timestamp;
    alter table audit_events alter column entity_id type text using entity_id::text;

    update case_archive_entries
    set status = 'published'
    where status is null or status = '';

    insert into case_archive_contributors (case_archive_entry_id, user_id)
    select distinct c.id, c.created_by_user_id
    from case_archive_entries c
    where c.created_by_user_id is not null
      and not exists (
        select 1
        from case_archive_contributors cc
        where cc.case_archive_entry_id = c.id
          and cc.user_id = c.created_by_user_id
      );

    create index if not exists idx_case_archive_entries_unit_status on case_archive_entries(unit_id, status);
    create index if not exists idx_case_archive_entries_creator on case_archive_entries(created_by_user_id);
    create index if not exists idx_case_archive_contributors_user on case_archive_contributors(user_id);
    create index if not exists idx_case_review_comments_case on case_review_comments(case_archive_entry_id, created_at desc);
    create index if not exists idx_case_related_documents_case on case_related_documents(case_archive_entry_id);
    create index if not exists idx_case_related_learning_case on case_related_learning_resources(case_archive_entry_id);
    create index if not exists idx_users_unit_status on users(unit_id, status);
    create index if not exists idx_users_unit_role on users(unit_id, role_id);
    create index if not exists idx_logbook_entries_user_date on logbook_entries(user_id, activity_date desc);
    create index if not exists idx_logbook_entries_unit_date on logbook_entries(unit_id, activity_date desc);
    create unique index if not exists idx_logbook_entries_user_case_number on logbook_entries(user_id, case_number) where case_number is not null;
    create index if not exists idx_logbook_entries_unit_surgery_name on logbook_entries(unit_id, procedure_name);
    create index if not exists idx_logbook_entry_comorbidities_entry on logbook_entry_comorbidities(logbook_entry_id, position);
    create index if not exists idx_logbook_entry_procedures_entry on logbook_entry_procedures(logbook_entry_id, position);
    create index if not exists idx_logbook_entry_analgesia_entry on logbook_entry_analgesia(logbook_entry_id, position);
    create index if not exists idx_logbook_entry_postop_entry on logbook_entry_postoperative_care(logbook_entry_id, position);
    create index if not exists idx_logbook_entry_learning_points_entry on logbook_entry_learning_points(logbook_entry_id, position);
    create index if not exists idx_logbook_involved_users_user on logbook_entry_involved_users(user_id, created_at desc);
    create index if not exists idx_learning_resources_unit_h5p on learning_resources(unit_id, h5p_content_id);
    create index if not exists idx_academy_programs_unit_status on academy_programs(unit_id, status);
    create index if not exists idx_academy_cohorts_unit_status on academy_cohorts(unit_id, status);
    create index if not exists idx_academy_cohort_members_user on academy_cohort_members(user_id);
    create index if not exists idx_academy_program_audiences_program on academy_program_audiences(program_id);
    create index if not exists idx_academy_program_audiences_cohort on academy_program_audiences(cohort_id);
    create index if not exists idx_academy_program_audiences_user on academy_program_audiences(user_id);
    create index if not exists idx_academy_chapters_program_slug on academy_chapters(program_id, slug);
    create index if not exists idx_academy_chapters_program_position on academy_chapters(program_id, position);
    create index if not exists idx_academy_subchapters_chapter_slug on academy_subchapters(chapter_id, slug);
    create index if not exists idx_academy_subchapters_chapter_position on academy_subchapters(chapter_id, position);
    create index if not exists idx_academy_items_subchapter_resource_unique on academy_items(subchapter_id, learning_resource_id);
    create index if not exists idx_academy_items_subchapter_position on academy_items(subchapter_id, position);
    create index if not exists idx_academy_item_attempts_user_item_created on academy_item_attempts(user_id, academy_item_id, created_at desc);
    create index if not exists idx_academy_item_attempts_unit_user_created on academy_item_attempts(unit_id, user_id, created_at desc);
    create index if not exists idx_academy_item_progress_unit_user on academy_item_progress(unit_id, user_id);
    create index if not exists idx_academy_item_progress_unit_item on academy_item_progress(unit_id, academy_item_id);
    do $$
    begin
      if not exists (
        select 1
        from pg_constraint
        where conname = 'learning_resources_h5p_content_unique'
      ) then
        alter table learning_resources
        add constraint learning_resources_h5p_content_unique unique (unit_id, h5p_content_id);
      end if;
    end $$;
  `);

  await client.end();
  console.log(`Database migrated: ${database}`);
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
