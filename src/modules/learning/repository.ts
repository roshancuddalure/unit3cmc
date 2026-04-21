import { randomUUID } from "crypto";
import type { PoolClient } from "pg";
import type { AppEnv } from "../../config/env";
import { getPool } from "../../db/pool";
import { query } from "../../db/query";
import { summarizeH5PXapiAttempt, summarizeManualAcademyProgress } from "./attempts";

export interface LearningResourceRecord {
  id: string;
  title: string;
  description: string;
  resourceType: string;
  status: string;
  sourceUrl: string;
  h5pContentId: string | null;
  placementCount: number;
}

export interface AssignableUserRecord {
  id: string;
  name: string;
  displayName: string;
  role: string;
  designation: string;
  trainingYear: string;
}

export interface AcademyCohortMemberRecord {
  userId: string;
  name: string;
  displayName: string;
  role: string;
  designation: string;
}

export interface AcademyCohortRecord {
  id: string;
  title: string;
  audienceKind: string;
  description: string;
  status: string;
  memberCount: number;
  members: AcademyCohortMemberRecord[];
}

export interface ProgramAudienceRecord {
  id: string;
  accessScope: string;
  roleKey: string | null;
  cohortId: string | null;
  userId: string | null;
  label: string;
}

export interface AcademyItemRecord {
  id: string;
  learningResourceId: string;
  title: string;
  titleOverride: string | null;
  description: string;
  itemType: string;
  position: number;
  isRequired: boolean;
  isAssessment: boolean;
  estimatedMinutes: number;
  resourceType: string;
  sourceUrl: string;
  status: string;
  h5pContentId: string | null;
  learnerStatus: string | null;
  learnerAttemptCount: number;
  learnerLatestScoreScaled: number | null;
  learnerBestScoreScaled: number | null;
  learnerFirstPassedAt: string | null;
}

export interface AcademySubchapterTree {
  id: string;
  title: string;
  summary: string;
  position: number;
  status: string;
  items: AcademyItemRecord[];
}

export interface AcademyChapterTree {
  id: string;
  title: string;
  summary: string;
  position: number;
  status: string;
  subchapters: AcademySubchapterTree[];
}

export interface AcademyProgramTree {
  id: string;
  title: string;
  description: string;
  status: string;
  chapters: AcademyChapterTree[];
}

export interface LearnerAcademySummary {
  trackedItems: number;
  startedItems: number;
  completedItems: number;
  passedAssessments: number;
  totalAttempts: number;
  averageBestScore: number | null;
}

export interface FacultyLearnerAnalyticsRow {
  userId: string;
  name: string;
  trackedItems: number;
  completedItems: number;
  inProgressItems: number;
  passedAssessments: number;
  averageBestScore: number | null;
  lastActivityAt: string | null;
}

export interface FacultyChapterAnalyticsRow {
  chapterId: string;
  title: string;
  placedItems: number;
  learnersStarted: number;
  completedItems: number;
  averageBestScore: number | null;
}

export interface FacultyAcademyAnalytics {
  trackedLearners: number;
  totalAttempts: number;
  completedItems: number;
  passedAssessments: number;
  averageBestScore: number | null;
  learnerRows: FacultyLearnerAnalyticsRow[];
  chapterRows: FacultyChapterAnalyticsRow[];
}

interface AcademyItemContextRow {
  academy_item_id: string;
  learning_resource_id: string;
  h5p_content_id: string | null;
}

export interface ProgramSummaryRow {
  id: string;
  title: string;
  description: string;
  status: string;
}

type MoveDirection = "up" | "down";

function toNumber(value: string | null | undefined): number {
  return Number(value ?? 0);
}

function toNullableNumber(value: string | null | undefined): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function nextProgressStatus(existingStatus: string | null, incomingStatus: string): string {
  if (existingStatus === "completed" && incomingStatus !== "completed") {
    return existingStatus;
  }

  if (existingStatus === "in_progress" && incomingStatus === "not_started") {
    return existingStatus;
  }

  return incomingStatus;
}

export class LearningRepository {
  constructor(private readonly env: AppEnv) {}

  async list(unitId: string): Promise<LearningResourceRecord[]> {
    const result = await query<{
      id: string;
      title: string;
      description: string;
      resource_type: string;
      status: string;
      source_url: string;
      h5p_content_id: string | null;
      placement_count: string;
    }>(
      this.env,
      `
        select
          lr.id,
          lr.title,
          lr.description,
          lr.resource_type,
          lr.status,
          lr.source_url,
          lr.h5p_content_id,
          count(ai.id)::text as placement_count
        from learning_resources lr
        left join academy_items ai on ai.learning_resource_id = lr.id
        where lr.unit_id = $1
        group by lr.id, lr.title, lr.description, lr.resource_type, lr.status, lr.source_url, lr.h5p_content_id, lr.created_at
        order by lr.created_at desc
      `,
      [unitId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      resourceType: row.resource_type,
      status: row.status,
      sourceUrl: row.source_url,
      h5pContentId: row.h5p_content_id,
      placementCount: Number(row.placement_count ?? 0)
    }));
  }

  async create(unitId: string, createdByUserId: string, title: string, resourceType: string, url: string): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into learning_resources (id, unit_id, created_by_user_id, title, resource_type, source_url, status)
        values ($1, $2, $3, $4, $5, $6, 'published')
      `,
      [id, unitId, createdByUserId, title, resourceType, url]
    );
    return id;
  }

  async markProgress(userId: string, unitId: string, learningResourceId: string, status: string): Promise<void> {
    await query(
      this.env,
      `
        insert into course_progress (id, unit_id, user_id, learning_resource_id, status)
        values ($1, $2, $3, $4, $5)
        on conflict (user_id, learning_resource_id)
        do update set status = excluded.status, updated_at = now()
      `,
      [randomUUID(), unitId, userId, learningResourceId, status]
    );
  }

  async listPrograms(unitId: string, status?: string): Promise<ProgramSummaryRow[]> {
    const result = await query<ProgramSummaryRow>(
      this.env,
      `
        select id, title, description, status
        from academy_programs
        where unit_id = $1
          and ($2::text is null or status = $2)
        order by updated_at desc, created_at desc
      `,
      [unitId, status ?? null]
    );

    return result.rows;
  }

  async getPrimaryProgram(unitId: string, status?: string): Promise<ProgramSummaryRow | null> {
    const programs = await this.listPrograms(unitId, status);
    return programs[0] ?? null;
  }

  async listAssignableUsers(unitId: string): Promise<AssignableUserRecord[]> {
    const result = await query<{
      id: string;
      name: string;
      display_name: string | null;
      role_key: string;
      designation: string | null;
      training_year: string | null;
    }>(
      this.env,
      `
        select
          u.id,
          u.name,
          u.display_name,
          r.key as role_key,
          u.designation,
          u.training_year
        from users u
        inner join roles r on r.id = u.role_id
        where u.unit_id = $1
          and u.status = 'active'
          and r.key <> 'super_admin'
        order by coalesce(nullif(u.display_name, ''), u.name) asc
      `,
      [unitId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      displayName: row.display_name ?? row.name,
      role: row.role_key,
      designation: row.designation ?? "",
      trainingYear: row.training_year ?? ""
    }));
  }

  async listCohorts(unitId: string): Promise<AcademyCohortRecord[]> {
    const cohortResult = await query<{
      id: string;
      title: string;
      audience_kind: string;
      description: string;
      status: string;
      member_count: string;
    }>(
      this.env,
      `
        select
          c.id,
          c.title,
          c.audience_kind,
          c.description,
          c.status,
          count(cm.user_id)::text as member_count
        from academy_cohorts c
        left join academy_cohort_members cm on cm.cohort_id = c.id
        where c.unit_id = $1
        group by c.id, c.title, c.audience_kind, c.description, c.status, c.created_at
        order by c.created_at desc, c.title asc
      `,
      [unitId]
    );

    const cohortIds = cohortResult.rows.map((row) => row.id);
    const membersByCohortId = new Map<string, AcademyCohortMemberRecord[]>();

    if (cohortIds.length) {
      const memberResult = await query<{
        cohort_id: string;
        user_id: string;
        name: string;
        display_name: string | null;
        role_key: string;
        designation: string | null;
      }>(
        this.env,
        `
          select
            cm.cohort_id,
            u.id as user_id,
            u.name,
            u.display_name,
            r.key as role_key,
            u.designation
          from academy_cohort_members cm
          inner join users u on u.id = cm.user_id
          inner join roles r on r.id = u.role_id
          where cm.cohort_id = any($1::uuid[])
          order by coalesce(nullif(u.display_name, ''), u.name) asc
        `,
        [cohortIds]
      );

      for (const row of memberResult.rows) {
        const group = membersByCohortId.get(row.cohort_id) ?? [];
        group.push({
          userId: row.user_id,
          name: row.name,
          displayName: row.display_name ?? row.name,
          role: row.role_key,
          designation: row.designation ?? ""
        });
        membersByCohortId.set(row.cohort_id, group);
      }
    }

    return cohortResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      audienceKind: row.audience_kind,
      description: row.description,
      status: row.status,
      memberCount: toNumber(row.member_count),
      members: membersByCohortId.get(row.id) ?? []
    }));
  }

  async createCohort(
    unitId: string,
    createdByUserId: string,
    title: string,
    description: string,
    audienceKind: string,
    status = "active",
    slug?: string
  ): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into academy_cohorts (id, unit_id, created_by_user_id, title, slug, description, audience_kind, status)
        values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [id, unitId, createdByUserId, title, slug ?? title.toLowerCase(), description, audienceKind, status]
    );
    return id;
  }

  async addCohortMember(unitId: string, cohortId: string, userId: string): Promise<void> {
    await query(
      this.env,
      `
        insert into academy_cohort_members (cohort_id, user_id)
        select $1, $2
        where exists (select 1 from academy_cohorts where id = $1 and unit_id = $3)
          and exists (select 1 from users where id = $2 and unit_id = $3 and status = 'active')
        on conflict (cohort_id, user_id) do nothing
      `,
      [cohortId, userId, unitId]
    );
  }

  async removeCohortMember(unitId: string, cohortId: string, userId: string): Promise<void> {
    await query(
      this.env,
      `
        delete from academy_cohort_members
        where cohort_id = $1
          and user_id = $2
          and exists (select 1 from academy_cohorts where id = $1 and unit_id = $3)
      `,
      [cohortId, userId, unitId]
    );
  }

  async listProgramAudiences(programId: string): Promise<ProgramAudienceRecord[]> {
    const result = await query<{
      id: string;
      access_scope: string;
      role_key: string | null;
      cohort_id: string | null;
      user_id: string | null;
      cohort_title: string | null;
      user_name: string | null;
      user_display_name: string | null;
    }>(
      this.env,
      `
        select
          pa.id,
          pa.access_scope,
          pa.role_key,
          pa.cohort_id,
          pa.user_id,
          c.title as cohort_title,
          u.name as user_name,
          u.display_name as user_display_name
        from academy_program_audiences pa
        left join academy_cohorts c on c.id = pa.cohort_id
        left join users u on u.id = pa.user_id
        where pa.program_id = $1
        order by pa.created_at asc
      `,
      [programId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      accessScope: row.access_scope,
      roleKey: row.role_key,
      cohortId: row.cohort_id,
      userId: row.user_id,
      label:
        row.access_scope === "open"
          ? "Open to all learners"
          : row.access_scope === "role"
            ? `Role: ${row.role_key}`
            : row.access_scope === "cohort"
              ? `Cohort: ${row.cohort_title ?? "Unknown cohort"}`
              : `User: ${row.user_display_name ?? row.user_name ?? "Unknown user"}`
    }));
  }

  async assignProgramAudience(input: {
    unitId: string;
    programId: string;
    accessScope: string;
    roleKey?: string;
    cohortId?: string;
    userId?: string;
  }): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into academy_program_audiences (id, program_id, access_scope, role_key, cohort_id, user_id)
        select $1, $2, $3, nullif($4, ''), nullif($5, '')::uuid, nullif($6, '')::uuid
        where exists (select 1 from academy_programs where id = $2 and unit_id = $7)
          and not exists (
            select 1
            from academy_program_audiences existing
            where existing.program_id = $2
              and existing.access_scope = $3
              and coalesce(existing.role_key, '') = coalesce(nullif($4, ''), '')
              and coalesce(existing.cohort_id::text, '') = coalesce(nullif($5, ''), '')
              and coalesce(existing.user_id::text, '') = coalesce(nullif($6, ''), '')
          )
      `,
      [id, input.programId, input.accessScope, input.roleKey ?? "", input.cohortId ?? "", input.userId ?? "", input.unitId]
    );
    return id;
  }

  async removeProgramAudience(unitId: string, audienceId: string): Promise<void> {
    await query(
      this.env,
      `
        delete from academy_program_audiences pa
        using academy_programs ap
        where pa.id = $1
          and ap.id = pa.program_id
          and ap.unit_id = $2
      `,
      [audienceId, unitId]
    );
  }

  async deleteProgram(unitId: string, programId: string): Promise<void> {
    await query(
      this.env,
      `
        delete from academy_programs
        where id = $1
          and unit_id = $2
      `,
      [programId, unitId]
    );
  }

  async listAssignedPrograms(unitId: string, userId: string, roleKey: string): Promise<ProgramSummaryRow[]> {
    const result = await query<ProgramSummaryRow>(
      this.env,
      `
        select
          ap.id,
          ap.title,
          ap.description,
          ap.status
        from academy_programs ap
        left join academy_program_audiences pa on pa.program_id = ap.id
        left join academy_cohort_members cm
          on cm.cohort_id = pa.cohort_id
         and cm.user_id = $2
        where ap.unit_id = $1
          and ap.status = 'published'
        group by ap.id, ap.title, ap.description, ap.status, ap.updated_at, ap.created_at
        having count(pa.id) = 0
          or bool_or(pa.access_scope = 'open')
          or bool_or(pa.access_scope = 'role' and pa.role_key = $3)
          or bool_or(pa.access_scope = 'user' and pa.user_id = $2)
          or bool_or(pa.access_scope = 'cohort' and cm.user_id is not null)
        order by ap.updated_at desc, ap.created_at desc
      `,
      [unitId, userId, roleKey]
    );

    return result.rows;
  }

  async getProgramTree(unitId: string, programId: string, learnerUserId?: string): Promise<AcademyProgramTree | null> {
    const programResult = await query<{ id: string; title: string; description: string; status: string }>(
      this.env,
      `
        select id, title, description, status
        from academy_programs
        where unit_id = $1 and id = $2
        limit 1
      `,
      [unitId, programId]
    );

    const program = programResult.rows[0];
    if (!program) {
      return null;
    }

    const chapterResult = await query<{
      id: string;
      title: string;
      summary: string;
      position: string;
      status: string;
    }>(
      this.env,
      `
        select id, title, summary, position::text, status
        from academy_chapters
        where program_id = $1
        order by position asc, created_at asc
      `,
      [programId]
    );

    const chapters = chapterResult.rows.map((row) => ({
      id: row.id,
      title: row.title,
      summary: row.summary,
      position: Number(row.position),
      status: row.status,
      subchapters: [] as AcademySubchapterTree[]
    }));

    const chapterIds = chapters.map((chapter) => chapter.id);
    const subchaptersByChapterId = new Map<string, AcademySubchapterTree[]>();

    if (chapterIds.length > 0) {
      const subchapterResult = await query<{
        id: string;
        chapter_id: string;
        title: string;
        summary: string;
        position: string;
        status: string;
      }>(
        this.env,
        `
          select id, chapter_id, title, summary, position::text, status
          from academy_subchapters
          where chapter_id = any($1::uuid[])
          order by position asc, created_at asc
        `,
        [chapterIds]
      );

      const subchapters = subchapterResult.rows.map((row) => ({
        id: row.id,
        chapterId: row.chapter_id,
        tree: {
          id: row.id,
          title: row.title,
          summary: row.summary,
          position: Number(row.position),
          status: row.status,
          items: [] as AcademyItemRecord[]
        }
      }));

      const subchapterIds = subchapters.map((subchapter) => subchapter.id);

      if (subchapterIds.length > 0) {
        const itemResult = await query<{
          id: string;
          subchapter_id: string;
          learning_resource_id: string;
          title_override: string | null;
          item_type: string;
          position: string;
          is_required: boolean;
          is_assessment: boolean;
          estimated_minutes: string;
          resource_title: string;
          resource_description: string;
          resource_type: string;
          resource_status: string;
          source_url: string;
          h5p_content_id: string | null;
          learner_status: string | null;
          learner_attempt_count: string | null;
          learner_latest_score_scaled: string | null;
          learner_best_score_scaled: string | null;
          learner_first_passed_at: string | null;
        }>(
          this.env,
          `
            select
              ai.id,
              ai.subchapter_id,
              ai.learning_resource_id,
              ai.title_override,
              ai.item_type,
              ai.position::text,
              ai.is_required,
              ai.is_assessment,
              ai.estimated_minutes::text,
              lr.title as resource_title,
              lr.description as resource_description,
              lr.resource_type,
              lr.status as resource_status,
              lr.source_url,
              lr.h5p_content_id,
              aip.status as learner_status,
              aip.attempt_count::text as learner_attempt_count,
              aip.latest_score_scaled::text as learner_latest_score_scaled,
              aip.best_score_scaled::text as learner_best_score_scaled,
              aip.first_passed_at::text as learner_first_passed_at
            from academy_items ai
            inner join learning_resources lr on lr.id = ai.learning_resource_id
            left join academy_item_progress aip
              on aip.academy_item_id = ai.id
             and aip.user_id = $2
            where ai.subchapter_id = any($1::uuid[])
            order by ai.position asc, ai.created_at asc
          `,
          [subchapterIds, learnerUserId ?? null]
        );

        const itemsBySubchapterId = new Map<string, AcademyItemRecord[]>();
        for (const row of itemResult.rows) {
          const items = itemsBySubchapterId.get(row.subchapter_id) ?? [];
          items.push({
            id: row.id,
            learningResourceId: row.learning_resource_id,
            title: row.title_override || row.resource_title,
            titleOverride: row.title_override,
            description: row.resource_description,
            itemType: row.item_type,
            position: Number(row.position),
            isRequired: row.is_required,
            isAssessment: row.is_assessment,
            estimatedMinutes: Number(row.estimated_minutes),
            resourceType: row.resource_type,
            sourceUrl: row.source_url,
            status: row.resource_status,
            h5pContentId: row.h5p_content_id,
            learnerStatus: row.learner_status,
            learnerAttemptCount: toNumber(row.learner_attempt_count),
            learnerLatestScoreScaled: toNullableNumber(row.learner_latest_score_scaled),
            learnerBestScoreScaled: toNullableNumber(row.learner_best_score_scaled),
            learnerFirstPassedAt: row.learner_first_passed_at
          });
          itemsBySubchapterId.set(row.subchapter_id, items);
        }

        for (const subchapter of subchapters) {
          subchapter.tree.items = itemsBySubchapterId.get(subchapter.id) ?? [];
        }
      }

      for (const subchapter of subchapters) {
        const group = subchaptersByChapterId.get(subchapter.chapterId) ?? [];
        group.push(subchapter.tree);
        subchaptersByChapterId.set(subchapter.chapterId, group);
      }
    }

    for (const chapter of chapters) {
      chapter.subchapters = subchaptersByChapterId.get(chapter.id) ?? [];
    }

    return {
      id: program.id,
      title: program.title,
      description: program.description,
      status: program.status,
      chapters
    };
  }

  async createProgram(
    unitId: string,
    createdByUserId: string,
    title: string,
    description: string,
    status = "draft",
    slug?: string
  ): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into academy_programs (id, unit_id, created_by_user_id, title, slug, description, status)
        values ($1, $2, $3, $4, $5, $6, $7)
      `,
      [id, unitId, createdByUserId, title, slug ?? title.toLowerCase(), description, status]
    );
    return id;
  }

  async updateProgram(unitId: string, programId: string, title: string, description: string, status: string): Promise<void> {
    const result = await query(
      this.env,
      `
        update academy_programs
        set title = $3,
            description = $4,
            status = $5,
            updated_at = current_timestamp
        where id = $1 and unit_id = $2
      `,
      [programId, unitId, title, description, status]
    );

    if (!result.rowCount) {
      throw new Error("The selected academy program could not be found.");
    }
  }

  async createChapter(programId: string, title: string, summary: string, slug: string, status = "draft"): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into academy_chapters (id, program_id, title, summary, slug, position, status)
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          coalesce((select max(position) + 1 from academy_chapters where program_id = $2), 0),
          $6
        )
      `,
      [id, programId, title, summary, slug, status]
    );
    return id;
  }

  async updateChapter(unitId: string, chapterId: string, title: string, summary: string, status: string): Promise<void> {
    const result = await query(
      this.env,
      `
        update academy_chapters ch
        set title = $3,
            summary = $4,
            status = $5,
            updated_at = current_timestamp
        from academy_programs ap
        where ch.id = $1
          and ap.id = ch.program_id
          and ap.unit_id = $2
      `,
      [chapterId, unitId, title, summary, status]
    );

    if (!result.rowCount) {
      throw new Error("The selected chapter could not be found.");
    }
  }

  async moveChapter(unitId: string, chapterId: string, direction: MoveDirection): Promise<void> {
    const client = await getPool(this.env).connect();

    try {
      await client.query("begin");

      const currentResult = await client.query<{
        id: string;
        program_id: string;
      }>(
        `
          select ch.id, ch.program_id
          from academy_chapters ch
          inner join academy_programs ap on ap.id = ch.program_id
          where ch.id = $1 and ap.unit_id = $2
          limit 1
        `,
        [chapterId, unitId]
      );

      const current = currentResult.rows[0];
      if (!current) {
        throw new Error("The selected chapter could not be found.");
      }

      const siblingsResult = await client.query<{
        id: string;
        position: string;
      }>(
        `
          select id, position::text
          from academy_chapters
          where program_id = $1
          order by position asc, created_at asc
        `,
        [current.program_id]
      );

      const index = siblingsResult.rows.findIndex((row) => row.id === chapterId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= siblingsResult.rows.length) {
        await client.query("commit");
        return;
      }

      const currentRow = siblingsResult.rows[index];
      const targetRow = siblingsResult.rows[targetIndex];
      await client.query(
        `
          update academy_chapters
          set position = case
              when id = $1 then $3
              when id = $2 then $4
              else position
            end,
              updated_at = current_timestamp
          where id in ($1, $2)
        `,
        [currentRow.id, targetRow.id, Number(targetRow.position), Number(currentRow.position)]
      );

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteChapter(unitId: string, chapterId: string): Promise<void> {
    const result = await query(
      this.env,
      `
        delete from academy_chapters ch
        using academy_programs ap
        where ch.id = $1
          and ap.id = ch.program_id
          and ap.unit_id = $2
      `,
      [chapterId, unitId]
    );

    if (!result.rowCount) {
      throw new Error("The selected chapter could not be found.");
    }
  }

  async createSubchapter(chapterId: string, title: string, summary: string, slug: string, status = "draft"): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into academy_subchapters (id, chapter_id, title, summary, slug, position, status)
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          coalesce((select max(position) + 1 from academy_subchapters where chapter_id = $2), 0),
          $6
        )
      `,
      [id, chapterId, title, summary, slug, status]
    );
    return id;
  }

  async updateSubchapter(unitId: string, subchapterId: string, title: string, summary: string, status: string): Promise<void> {
    const result = await query(
      this.env,
      `
        update academy_subchapters sc
        set title = $3,
            summary = $4,
            status = $5,
            updated_at = current_timestamp
        from academy_chapters ch
        inner join academy_programs ap on ap.id = ch.program_id
        where sc.id = $1
          and ch.id = sc.chapter_id
          and ap.unit_id = $2
      `,
      [subchapterId, unitId, title, summary, status]
    );

    if (!result.rowCount) {
      throw new Error("The selected subchapter could not be found.");
    }
  }

  async moveSubchapter(unitId: string, subchapterId: string, direction: MoveDirection): Promise<void> {
    const client = await getPool(this.env).connect();

    try {
      await client.query("begin");

      const currentResult = await client.query<{
        id: string;
        chapter_id: string;
      }>(
        `
          select sc.id, sc.chapter_id
          from academy_subchapters sc
          inner join academy_chapters ch on ch.id = sc.chapter_id
          inner join academy_programs ap on ap.id = ch.program_id
          where sc.id = $1 and ap.unit_id = $2
          limit 1
        `,
        [subchapterId, unitId]
      );

      const current = currentResult.rows[0];
      if (!current) {
        throw new Error("The selected subchapter could not be found.");
      }

      const siblingsResult = await client.query<{
        id: string;
        position: string;
      }>(
        `
          select id, position::text
          from academy_subchapters
          where chapter_id = $1
          order by position asc, created_at asc
        `,
        [current.chapter_id]
      );

      const index = siblingsResult.rows.findIndex((row) => row.id === subchapterId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= siblingsResult.rows.length) {
        await client.query("commit");
        return;
      }

      const currentRow = siblingsResult.rows[index];
      const targetRow = siblingsResult.rows[targetIndex];
      await client.query(
        `
          update academy_subchapters
          set position = case
              when id = $1 then $3
              when id = $2 then $4
              else position
            end,
              updated_at = current_timestamp
          where id in ($1, $2)
        `,
        [currentRow.id, targetRow.id, Number(targetRow.position), Number(currentRow.position)]
      );

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteSubchapter(unitId: string, subchapterId: string): Promise<void> {
    const result = await query(
      this.env,
      `
        delete from academy_subchapters sc
        using academy_chapters ch, academy_programs ap
        where sc.id = $1
          and ch.id = sc.chapter_id
          and ap.id = ch.program_id
          and ap.unit_id = $2
      `,
      [subchapterId, unitId]
    );

    if (!result.rowCount) {
      throw new Error("The selected subchapter could not be found.");
    }
  }

  async placeResourceInSubchapter(input: {
    subchapterId: string;
    learningResourceId: string;
    itemType: string;
    titleOverride?: string;
    isRequired: boolean;
    isAssessment: boolean;
    estimatedMinutes: number;
    status?: string;
  }): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into academy_items (
          id,
          subchapter_id,
          learning_resource_id,
          item_type,
          title_override,
          position,
          is_required,
          is_assessment,
          estimated_minutes,
          status
        )
        values (
          $1,
          $2,
          $3,
          $4,
          nullif($5, ''),
          coalesce((select max(position) + 1 from academy_items where subchapter_id = $2), 0),
          $6,
          $7,
          $8,
          $9
        )
      `,
      [
        id,
        input.subchapterId,
        input.learningResourceId,
        input.itemType,
        input.titleOverride ?? "",
        input.isRequired,
        input.isAssessment,
        input.estimatedMinutes,
        input.status ?? "draft"
      ]
    );
    return id;
  }

  async updateAcademyItem(input: {
    unitId: string;
    academyItemId: string;
    titleOverride: string;
    isRequired: boolean;
    isAssessment: boolean;
    estimatedMinutes: number;
    status: string;
    subchapterId: string;
  }): Promise<void> {
    const client = await getPool(this.env).connect();

    try {
      await client.query("begin");

      const currentResult = await client.query<{
        id: string;
        subchapter_id: string;
      }>(
        `
          select ai.id, ai.subchapter_id
          from academy_items ai
          inner join academy_subchapters sc on sc.id = ai.subchapter_id
          inner join academy_chapters ch on ch.id = sc.chapter_id
          inner join academy_programs ap on ap.id = ch.program_id
          where ai.id = $1 and ap.unit_id = $2
          limit 1
        `,
        [input.academyItemId, input.unitId]
      );

      const current = currentResult.rows[0];
      if (!current) {
        throw new Error("The selected academy item could not be found.");
      }

      const targetSubchapterResult = await client.query<{ id: string }>(
        `
          select sc.id
          from academy_subchapters sc
          inner join academy_chapters ch on ch.id = sc.chapter_id
          inner join academy_programs ap on ap.id = ch.program_id
          where sc.id = $1 and ap.unit_id = $2
          limit 1
        `,
        [input.subchapterId, input.unitId]
      );

      if (!targetSubchapterResult.rowCount) {
        throw new Error("The selected target subchapter could not be found.");
      }

      let nextPositionResult = { rows: [{ next_position: "0" }] };
      if (current.subchapter_id !== input.subchapterId) {
        nextPositionResult = await client.query<{ next_position: string }>(
          `
            select coalesce(max(position) + 1, 0)::text as next_position
            from academy_items
            where subchapter_id = $1
          `,
          [input.subchapterId]
        );
      }

      await client.query(
        `
          update academy_items
          set subchapter_id = $2,
              title_override = nullif($3, ''),
              is_required = $4,
              is_assessment = $5,
              estimated_minutes = $6,
              status = $7,
              position = case
                when subchapter_id = $2 then position
                else $8
              end,
              updated_at = current_timestamp
          where id = $1
        `,
        [
          input.academyItemId,
          input.subchapterId,
          input.titleOverride,
          input.isRequired,
          input.isAssessment,
          input.estimatedMinutes,
          input.status,
          Number(nextPositionResult.rows[0]?.next_position ?? "0")
        ]
      );

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async moveAcademyItem(unitId: string, academyItemId: string, direction: MoveDirection): Promise<void> {
    const client = await getPool(this.env).connect();

    try {
      await client.query("begin");

      const currentResult = await client.query<{
        id: string;
        subchapter_id: string;
      }>(
        `
          select ai.id, ai.subchapter_id
          from academy_items ai
          inner join academy_subchapters sc on sc.id = ai.subchapter_id
          inner join academy_chapters ch on ch.id = sc.chapter_id
          inner join academy_programs ap on ap.id = ch.program_id
          where ai.id = $1 and ap.unit_id = $2
          limit 1
        `,
        [academyItemId, unitId]
      );

      const current = currentResult.rows[0];
      if (!current) {
        throw new Error("The selected academy item could not be found.");
      }

      const siblingsResult = await client.query<{
        id: string;
        position: string;
      }>(
        `
          select id, position::text
          from academy_items
          where subchapter_id = $1
          order by position asc, created_at asc
        `,
        [current.subchapter_id]
      );

      const index = siblingsResult.rows.findIndex((row) => row.id === academyItemId);
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (index === -1 || targetIndex < 0 || targetIndex >= siblingsResult.rows.length) {
        await client.query("commit");
        return;
      }

      const currentRow = siblingsResult.rows[index];
      const targetRow = siblingsResult.rows[targetIndex];
      await client.query(
        `
          update academy_items
          set position = case
              when id = $1 then $3
              when id = $2 then $4
              else position
            end,
              updated_at = current_timestamp
          where id in ($1, $2)
        `,
        [currentRow.id, targetRow.id, Number(targetRow.position), Number(currentRow.position)]
      );

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteAcademyItem(unitId: string, academyItemId: string): Promise<void> {
    const result = await query(
      this.env,
      `
        delete from academy_items ai
        using academy_subchapters sc, academy_chapters ch, academy_programs ap
        where ai.id = $1
          and sc.id = ai.subchapter_id
          and ch.id = sc.chapter_id
          and ap.id = ch.program_id
          and ap.unit_id = $2
      `,
      [academyItemId, unitId]
    );

    if (!result.rowCount) {
      throw new Error("The selected academy item could not be found.");
    }
  }

  private async resolveAcademyItemContextForClient(
    client: PoolClient,
    unitId: string,
    academyItemId: string
  ): Promise<AcademyItemContextRow | null> {
    const result = await client.query<AcademyItemContextRow>(
      `
        select
          ai.id as academy_item_id,
          ai.learning_resource_id,
          lr.h5p_content_id
        from academy_items ai
        inner join learning_resources lr on lr.id = ai.learning_resource_id
        where ai.id = $1
          and lr.unit_id = $2
        limit 1
      `,
      [academyItemId, unitId]
    );

    return result.rows[0] ?? null;
  }

  private async upsertAcademyProgressForClient(
    client: PoolClient,
    input: {
      unitId: string;
      userId: string;
      academyItemId: string;
      learningResourceId: string;
      status: string;
      latestAttemptSource: string;
      latestScoreScaled: number | null;
      passed: boolean | null;
      createdAtIso: string;
    }
  ): Promise<void> {
    const existing = await client.query<{
      status: string;
      attempt_count: string;
      passed_attempt_count: string;
      best_score_scaled: string | null;
      first_passed_at: string | null;
      completed_at: string | null;
    }>(
      `
        select
          status,
          attempt_count::text,
          passed_attempt_count::text,
          best_score_scaled::text,
          first_passed_at::text,
          completed_at::text
        from academy_item_progress
        where user_id = $1 and academy_item_id = $2
        limit 1
      `,
      [input.userId, input.academyItemId]
    );

    const current = existing.rows[0];
    const nextStatus = nextProgressStatus(current?.status ?? null, input.status);
    const currentBest = toNullableNumber(current?.best_score_scaled);
    const nextBest =
      input.latestScoreScaled === null
        ? currentBest
        : currentBest === null
          ? input.latestScoreScaled
          : Math.max(currentBest, input.latestScoreScaled);
    const nextPassedAttemptCount = toNumber(current?.passed_attempt_count) + (input.passed ? 1 : 0);
    const nextAttemptCount = toNumber(current?.attempt_count) + 1;
    const nextFirstPassedAt = current?.first_passed_at ?? (input.passed ? input.createdAtIso : null);
    const nextCompletedAt = current?.completed_at ?? (nextStatus === "completed" ? input.createdAtIso : null);

    await client.query(
      `
        insert into academy_item_progress (
          id,
          unit_id,
          user_id,
          academy_item_id,
          learning_resource_id,
          status,
          latest_attempt_at,
          latest_attempt_source,
          attempt_count,
          latest_score_scaled,
          best_score_scaled,
          passed_attempt_count,
          first_passed_at,
          completed_at
        )
        values ($1, $2, $3, $4, $5, $6, $7::timestamp, $8, $9, $10, $11, $12, $13::timestamp, $14::timestamp)
        on conflict (user_id, academy_item_id)
        do update set
          status = excluded.status,
          latest_attempt_at = excluded.latest_attempt_at,
          latest_attempt_source = excluded.latest_attempt_source,
          attempt_count = excluded.attempt_count,
          latest_score_scaled = excluded.latest_score_scaled,
          best_score_scaled = excluded.best_score_scaled,
          passed_attempt_count = excluded.passed_attempt_count,
          first_passed_at = excluded.first_passed_at,
          completed_at = excluded.completed_at,
          updated_at = current_timestamp
      `,
      [
        current ? randomUUID() : randomUUID(),
        input.unitId,
        input.userId,
        input.academyItemId,
        input.learningResourceId,
        nextStatus,
        input.createdAtIso,
        input.latestAttemptSource,
        nextAttemptCount,
        input.latestScoreScaled,
        nextBest,
        nextPassedAttemptCount,
        nextFirstPassedAt,
        nextCompletedAt
      ]
    );
  }

  async markAcademyItemProgress(userId: string, unitId: string, academyItemId: string, status: string): Promise<void> {
    const client = await getPool(this.env).connect();

    try {
      await client.query("begin");
      const item = await this.resolveAcademyItemContextForClient(client, unitId, academyItemId);
      if (!item) {
        throw new Error("The selected academy item could not be found.");
      }

      const summary = summarizeManualAcademyProgress(status);
      const createdAtIso = new Date().toISOString();

      await client.query(
        `
          insert into academy_item_attempts (
            id,
            unit_id,
            user_id,
            academy_item_id,
            learning_resource_id,
            h5p_content_id,
            source_type,
            attempt_kind,
            verb,
            progress_status,
            passed,
            result_json,
            statement_json
          )
          values ($1, $2, $3, $4, $5, $6, 'manual', $7, $8, $9, $10, '{}'::jsonb, '{}'::jsonb)
        `,
        [
          randomUUID(),
          unitId,
          userId,
          item.academy_item_id,
          item.learning_resource_id,
          item.h5p_content_id,
          summary.attemptKind,
          `manual:${summary.progressStatus ?? "not_started"}`,
          summary.progressStatus ?? "not_started",
          summary.passed
        ]
      );

      await this.upsertAcademyProgressForClient(client, {
        unitId,
        userId,
        academyItemId: item.academy_item_id,
        learningResourceId: item.learning_resource_id,
        status: summary.progressStatus ?? "not_started",
        latestAttemptSource: "manual",
        latestScoreScaled: summary.scoreScaled,
        passed: summary.passed,
        createdAtIso
      });

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async recordAcademyItemXapiAttempt(input: {
    unitId: string;
    userId: string;
    academyItemId: string | null;
    contentId: string;
    verb: string;
    resultJson: unknown;
    statementJson: unknown;
  }): Promise<boolean> {
    if (!input.academyItemId) {
      return false;
    }

    const client = await getPool(this.env).connect();

    try {
      await client.query("begin");

      const itemResult = await client.query<AcademyItemContextRow>(
        `
          select
            ai.id as academy_item_id,
            ai.learning_resource_id,
            lr.h5p_content_id
          from academy_items ai
          inner join learning_resources lr on lr.id = ai.learning_resource_id
          where ai.id = $1
            and lr.unit_id = $2
            and lr.h5p_content_id = $3
          limit 1
        `,
        [input.academyItemId, input.unitId, input.contentId]
      );

      const item = itemResult.rows[0];
      if (!item) {
        await client.query("rollback");
        return false;
      }

      const summary = summarizeH5PXapiAttempt(input.verb, input.resultJson);
      if (
        summary.progressStatus === null &&
        summary.scoreScaled === null &&
        summary.passed === null &&
        summary.timeSpentSeconds === null
      ) {
        await client.query("rollback");
        return false;
      }

      const createdAtIso = new Date().toISOString();

      await client.query(
        `
          insert into academy_item_attempts (
            id,
            unit_id,
            user_id,
            academy_item_id,
            learning_resource_id,
            h5p_content_id,
            source_type,
            attempt_kind,
            verb,
            progress_status,
            score_raw,
            score_max,
            score_scaled,
            passed,
            time_spent_seconds,
            result_json,
            statement_json
          )
          values (
            $1,
            $2,
            $3,
            $4,
            $5,
            $6,
            'h5p',
            $7,
            $8,
            $9,
            $10,
            $11,
            $12,
            $13,
            $14,
            $15::jsonb,
            $16::jsonb
          )
        `,
        [
          randomUUID(),
          input.unitId,
          input.userId,
          item.academy_item_id,
          item.learning_resource_id,
          input.contentId,
          summary.attemptKind,
          input.verb,
          summary.progressStatus ?? "in_progress",
          summary.scoreRaw,
          summary.scoreMax,
          summary.scoreScaled,
          summary.passed,
          summary.timeSpentSeconds,
          JSON.stringify(input.resultJson ?? {}),
          JSON.stringify(input.statementJson ?? {})
        ]
      );

      await this.upsertAcademyProgressForClient(client, {
        unitId: input.unitId,
        userId: input.userId,
        academyItemId: item.academy_item_id,
        learningResourceId: item.learning_resource_id,
        status: summary.progressStatus ?? "in_progress",
        latestAttemptSource: "h5p",
        latestScoreScaled: summary.scoreScaled,
        passed: summary.passed,
        createdAtIso
      });

      await client.query("commit");
      return true;
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getLearnerAcademySummary(unitId: string, userId: string): Promise<LearnerAcademySummary> {
    const result = await query<{
      tracked_items: string;
      started_items: string;
      completed_items: string;
      passed_assessments: string;
      total_attempts: string;
      average_best_score: string | null;
    }>(
      this.env,
      `
        select
          count(*)::text as tracked_items,
          count(*) filter (where status in ('in_progress', 'completed'))::text as started_items,
          count(*) filter (where status = 'completed')::text as completed_items,
          count(*) filter (where first_passed_at is not null)::text as passed_assessments,
          coalesce(sum(attempt_count), 0)::text as total_attempts,
          avg(best_score_scaled)::text as average_best_score
        from academy_item_progress
        where unit_id = $1 and user_id = $2
      `,
      [unitId, userId]
    );

    const row = result.rows[0];
    return {
      trackedItems: toNumber(row?.tracked_items),
      startedItems: toNumber(row?.started_items),
      completedItems: toNumber(row?.completed_items),
      passedAssessments: toNumber(row?.passed_assessments),
      totalAttempts: toNumber(row?.total_attempts),
      averageBestScore: toNullableNumber(row?.average_best_score)
    };
  }

  async getFacultyAcademyAnalytics(unitId: string): Promise<FacultyAcademyAnalytics> {
    const [overviewResult, learnerResult, chapterResult] = await Promise.all([
      query<{
        tracked_learners: string;
        total_attempts: string;
        completed_items: string;
        passed_assessments: string;
        average_best_score: string | null;
      }>(
        this.env,
        `
          select
            count(distinct p.user_id)::text as tracked_learners,
            coalesce(sum(p.attempt_count), 0)::text as total_attempts,
            count(*) filter (where p.status = 'completed')::text as completed_items,
            count(*) filter (where p.first_passed_at is not null)::text as passed_assessments,
            avg(p.best_score_scaled)::text as average_best_score
          from academy_item_progress p
          inner join users u on u.id = p.user_id
          inner join roles r on r.id = u.role_id
          where p.unit_id = $1
            and u.status = 'active'
            and r.key = 'postgraduate'
        `,
        [unitId]
      ),
      query<{
        user_id: string;
        name: string;
        tracked_items: string;
        completed_items: string;
        in_progress_items: string;
        passed_assessments: string;
        average_best_score: string | null;
        last_activity_at: string | null;
      }>(
        this.env,
        `
          select
            u.id as user_id,
            coalesce(nullif(u.display_name, ''), u.name) as name,
            count(*)::text as tracked_items,
            count(*) filter (where p.status = 'completed')::text as completed_items,
            count(*) filter (where p.status = 'in_progress')::text as in_progress_items,
            count(*) filter (where p.first_passed_at is not null)::text as passed_assessments,
            avg(p.best_score_scaled)::text as average_best_score,
            max(p.latest_attempt_at)::text as last_activity_at
          from academy_item_progress p
          inner join users u on u.id = p.user_id
          inner join roles r on r.id = u.role_id
          where p.unit_id = $1
            and u.status = 'active'
            and r.key = 'postgraduate'
          group by u.id, coalesce(nullif(u.display_name, ''), u.name)
          order by max(p.latest_attempt_at) desc nulls last, coalesce(nullif(u.display_name, ''), u.name) asc
          limit 8
        `,
        [unitId]
      ),
      query<{
        chapter_id: string;
        title: string;
        placed_items: string;
        learners_started: string;
        completed_items: string;
        average_best_score: string | null;
      }>(
        this.env,
        `
          select
            ch.id as chapter_id,
            ch.title,
            count(distinct ai.id)::text as placed_items,
            count(distinct case when p.status in ('in_progress', 'completed') then p.user_id end)::text as learners_started,
            count(case when p.status = 'completed' then 1 end)::text as completed_items,
            avg(p.best_score_scaled)::text as average_best_score
          from academy_chapters ch
          inner join academy_subchapters sc on sc.chapter_id = ch.id
          inner join academy_items ai on ai.subchapter_id = sc.id
          left join academy_item_progress p on p.academy_item_id = ai.id
          inner join academy_programs ap on ap.id = ch.program_id
          where ap.unit_id = $1
          group by ch.id, ch.title, ch.position
          order by ch.position asc, ch.title asc
        `,
        [unitId]
      )
    ]);

    const overview = overviewResult.rows[0];
    return {
      trackedLearners: toNumber(overview?.tracked_learners),
      totalAttempts: toNumber(overview?.total_attempts),
      completedItems: toNumber(overview?.completed_items),
      passedAssessments: toNumber(overview?.passed_assessments),
      averageBestScore: toNullableNumber(overview?.average_best_score),
      learnerRows: learnerResult.rows.map((row) => ({
        userId: row.user_id,
        name: row.name,
        trackedItems: toNumber(row.tracked_items),
        completedItems: toNumber(row.completed_items),
        inProgressItems: toNumber(row.in_progress_items),
        passedAssessments: toNumber(row.passed_assessments),
        averageBestScore: toNullableNumber(row.average_best_score),
        lastActivityAt: row.last_activity_at
      })),
      chapterRows: chapterResult.rows.map((row) => ({
        chapterId: row.chapter_id,
        title: row.title,
        placedItems: toNumber(row.placed_items),
        learnersStarted: toNumber(row.learners_started),
        completedItems: toNumber(row.completed_items),
        averageBestScore: toNullableNumber(row.average_best_score)
      }))
    };
  }
}
