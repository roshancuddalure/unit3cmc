import { randomUUID } from "crypto";
import type { AppEnv } from "../../config/env";
import { query } from "../../db/query";

export interface CaseArchiveRecord {
  id: string;
  title: string;
  subtitle: string | null;
  summary: string;
  learningPoints: string;
  specialtyArea: string;
  anaesthesiaTechnique: string;
  urgency: string;
  patientAgeBand: string;
  complexityLevel: string;
  setting: string;
  hadCriticalEvent: boolean;
  isFeatured: boolean;
  status: string;
  tags: string[];
  contributorNames: string[];
  createdAt: string;
}

export interface CaseArchiveDetailRecord extends CaseArchiveRecord {
  createdByUserId: string | null;
  createdByName: string | null;
  contributorUserIds: string[];
  whyThisCaseMatters: string;
  keyDecisionPoints: string;
  whatWentWell: string;
  whatCouldImprove: string;
  takeHomePoints: string;
  relatedDocuments: Array<{ id: string; title: string }>;
  relatedLearningResources: Array<{ id: string; title: string; resourceType: string }>;
  similarCases: CaseArchiveRecord[];
}

export interface CaseContributorOption {
  id: string;
  displayName: string;
  designation: string | null;
}

export interface CaseReviewCommentRecord {
  id: string;
  comment: string;
  commentType: string;
  createdAt: string;
  authorName: string | null;
}

export interface RelatedDocumentOption {
  id: string;
  title: string;
}

export interface RelatedLearningOption {
  id: string;
  title: string;
  resourceType: string;
}

export interface CaseListFilters {
  search?: string;
  specialtyArea?: string;
  anaesthesiaTechnique?: string;
  urgency?: string;
  complexityLevel?: string;
  contributorUserId?: string;
}

function mapCaseRecord(row: {
  id: string;
  title: string;
  subtitle: string | null;
  summary: string;
  learning_points: string;
  specialty_area: string;
  anaesthesia_technique: string;
  urgency: string;
  patient_age_band: string;
  complexity_level: string;
  setting: string;
  had_critical_event: boolean;
  is_featured: boolean;
  status: string;
  tags: string[];
  contributor_names: string[] | null;
  created_at: string;
}): CaseArchiveRecord {
  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    summary: row.summary,
    learningPoints: row.learning_points,
    specialtyArea: row.specialty_area,
    anaesthesiaTechnique: row.anaesthesia_technique,
    urgency: row.urgency,
    patientAgeBand: row.patient_age_band,
    complexityLevel: row.complexity_level,
    setting: row.setting,
    hadCriticalEvent: row.had_critical_event,
    isFeatured: row.is_featured,
    status: row.status,
    tags: row.tags,
    contributorNames: row.contributor_names ?? [],
    createdAt: row.created_at
  };
}

export class CasesRepository {
  constructor(private readonly env: AppEnv) {}

  async listPublished(unitId: string, filters: CaseListFilters = {}): Promise<CaseArchiveRecord[]> {
    const search = filters.search?.trim() || "";
    const specialtyArea = filters.specialtyArea?.trim() || "";
    const anaesthesiaTechnique = filters.anaesthesiaTechnique?.trim() || "";
    const urgency = filters.urgency?.trim() || "";
    const complexityLevel = filters.complexityLevel?.trim() || "";
    const contributorUserId = filters.contributorUserId?.trim() || "";

    const result = await query<{
      id: string;
      title: string;
      subtitle: string | null;
      summary: string;
      learning_points: string;
      specialty_area: string;
      anaesthesia_technique: string;
      urgency: string;
      patient_age_band: string;
      complexity_level: string;
      setting: string;
      had_critical_event: boolean;
      is_featured: boolean;
      status: string;
      tags: string[];
      contributor_names: string[] | null;
      created_at: string;
    }>(
      this.env,
      `
        select
          c.id,
          c.title,
          c.subtitle,
          c.summary,
          c.learning_points,
          c.specialty_area,
          c.anaesthesia_technique,
          c.urgency,
          c.patient_age_band,
          c.complexity_level,
          c.setting,
          c.had_critical_event,
          c.is_featured,
          c.status,
          c.tags,
          c.created_at::text,
          coalesce(
            array_agg(distinct coalesce(nullif(u.display_name, ''), u.name))
              filter (where u.id is not null),
            '{}'
          ) as contributor_names
        from case_archive_entries c
        left join case_archive_contributors cc on cc.case_archive_entry_id = c.id
        left join users u on u.id = cc.user_id
        where c.unit_id = $1
          and c.status = 'published'
          and (
            $2 = ''
            or c.title ilike '%' || $2 || '%'
            or coalesce(c.subtitle, '') ilike '%' || $2 || '%'
            or c.summary ilike '%' || $2 || '%'
            or c.learning_points ilike '%' || $2 || '%'
            or exists (
              select 1
              from unnest(c.tags) as case_tag
              where case_tag ilike '%' || $2 || '%'
            )
          )
          and ($3 = '' or c.specialty_area = $3)
          and ($4 = '' or c.anaesthesia_technique = $4)
          and ($5 = '' or c.urgency = $5)
          and ($6 = '' or c.complexity_level = $6)
          and (
            $7 = ''
            or exists (
              select 1
              from case_archive_contributors filter_cc
              where filter_cc.case_archive_entry_id = c.id
                and filter_cc.user_id = $7
            )
          )
        group by c.id
        order by c.created_at desc
      `,
      [unitId, search, specialtyArea, anaesthesiaTechnique, urgency, complexityLevel, contributorUserId]
    );

    return result.rows.map(mapCaseRecord);
  }

  async listForUser(unitId: string, userId: string): Promise<CaseArchiveRecord[]> {
    const result = await query<{
      id: string;
      title: string;
      subtitle: string | null;
      summary: string;
      learning_points: string;
      specialty_area: string;
      anaesthesia_technique: string;
      urgency: string;
      patient_age_band: string;
      complexity_level: string;
      setting: string;
      had_critical_event: boolean;
      is_featured: boolean;
      status: string;
      tags: string[];
      contributor_names: string[] | null;
      created_at: string;
    }>(
      this.env,
      `
        select
          c.id,
          c.title,
          c.subtitle,
          c.summary,
          c.learning_points,
          c.specialty_area,
          c.anaesthesia_technique,
          c.urgency,
          c.patient_age_band,
          c.complexity_level,
          c.setting,
          c.had_critical_event,
          c.is_featured,
          c.status,
          c.tags,
          c.created_at::text,
          coalesce(
            array_agg(distinct coalesce(nullif(u.display_name, ''), u.name))
              filter (where u.id is not null),
            '{}'
          ) as contributor_names
        from case_archive_entries c
        left join case_archive_contributors cc on cc.case_archive_entry_id = c.id
        left join users u on u.id = cc.user_id
        where c.unit_id = $1
          and (
            c.created_by_user_id = $2
            or exists (
              select 1
              from case_archive_contributors own_cc
              where own_cc.case_archive_entry_id = c.id
                and own_cc.user_id = $2
            )
          )
        group by c.id
        order by c.created_at desc
      `,
      [unitId, userId]
    );

    return result.rows.map(mapCaseRecord);
  }

  async listReviewQueue(unitId: string): Promise<CaseArchiveRecord[]> {
    const result = await query<{
      id: string;
      title: string;
      subtitle: string | null;
      summary: string;
      learning_points: string;
      specialty_area: string;
      anaesthesia_technique: string;
      urgency: string;
      patient_age_band: string;
      complexity_level: string;
      setting: string;
      had_critical_event: boolean;
      is_featured: boolean;
      status: string;
      tags: string[];
      contributor_names: string[] | null;
      created_at: string;
    }>(
      this.env,
      `
        select
          c.id,
          c.title,
          c.subtitle,
          c.summary,
          c.learning_points,
          c.specialty_area,
          c.anaesthesia_technique,
          c.urgency,
          c.patient_age_band,
          c.complexity_level,
          c.setting,
          c.had_critical_event,
          c.is_featured,
          c.status,
          c.tags,
          c.created_at::text,
          coalesce(
            array_agg(distinct coalesce(nullif(u.display_name, ''), u.name))
              filter (where u.id is not null),
            '{}'
          ) as contributor_names
        from case_archive_entries c
        left join case_archive_contributors cc on cc.case_archive_entry_id = c.id
        left join users u on u.id = cc.user_id
        where c.unit_id = $1
          and c.status in ('submitted', 'changes_requested', 'approved')
        group by c.id
        order by
          case c.status
            when 'submitted' then 1
            when 'changes_requested' then 2
            when 'approved' then 3
            else 4
          end,
          c.created_at desc
      `,
      [unitId]
    );

    return result.rows.map(mapCaseRecord);
  }

  async listActiveUsers(unitId: string): Promise<CaseContributorOption[]> {
    const result = await query<{
      id: string;
      display_name: string | null;
      name: string;
      designation: string | null;
    }>(
      this.env,
      `
        select
          id,
          display_name,
          name,
          designation
        from users
        where unit_id = $1
          and status = 'active'
        order by coalesce(nullif(display_name, ''), name)
      `,
      [unitId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      displayName: row.display_name?.trim() || row.name,
      designation: row.designation
    }));
  }

  async listPublishedDocuments(unitId: string): Promise<RelatedDocumentOption[]> {
    const result = await query<{ id: string; title: string }>(
      this.env,
      `
        select id, title
        from documents
        where unit_id = $1
          and document_type = 'sop'
          and status = 'published'
        order by title asc
      `,
      [unitId]
    );

    return result.rows;
  }

  async listPublishedLearningResources(unitId: string): Promise<RelatedLearningOption[]> {
    const result = await query<{ id: string; title: string; resource_type: string }>(
      this.env,
      `
        select id, title, resource_type
        from learning_resources
        where unit_id = $1
          and status = 'published'
        order by title asc
      `,
      [unitId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      resourceType: row.resource_type
    }));
  }

  async hasCaseReviewGrant(unitId: string, userId: string): Promise<boolean> {
    const result = await query<{ can_review_cases: boolean }>(
      this.env,
      `
        select can_review_cases
        from users
        where unit_id = $1 and id = $2
        limit 1
      `,
      [unitId, userId]
    );

    return result.rows[0]?.can_review_cases ?? false;
  }

  async getById(caseId: string, unitId: string): Promise<CaseArchiveDetailRecord | null> {
    const result = await query<{
      id: string;
      title: string;
      subtitle: string | null;
      summary: string;
      learning_points: string;
      specialty_area: string;
      anaesthesia_technique: string;
      urgency: string;
      patient_age_band: string;
      complexity_level: string;
      setting: string;
      had_critical_event: boolean;
      is_featured: boolean;
      status: string;
      tags: string[];
      contributor_names: string[] | null;
      contributor_user_ids: string[] | null;
      created_at: string;
      created_by_user_id: string | null;
      created_by_name: string | null;
      why_this_case_matters: string;
      key_decision_points: string;
      what_went_well: string;
      what_could_improve: string;
      take_home_points: string;
    }>(
      this.env,
      `
        select
          c.id,
          c.title,
          c.subtitle,
          c.summary,
          c.learning_points,
          c.specialty_area,
          c.anaesthesia_technique,
          c.urgency,
          c.patient_age_band,
          c.complexity_level,
          c.setting,
          c.had_critical_event,
          c.is_featured,
          c.status,
          c.tags,
          c.created_at::text,
          c.created_by_user_id,
          creator.name as created_by_name,
          c.why_this_case_matters,
          c.key_decision_points,
          c.what_went_well,
          c.what_could_improve,
          c.take_home_points,
          coalesce(
            array_agg(distinct coalesce(nullif(u.display_name, ''), u.name))
              filter (where u.id is not null),
            '{}'
          ) as contributor_names,
          coalesce(
            array_agg(distinct u.id)
              filter (where u.id is not null),
            '{}'
          ) as contributor_user_ids
        from case_archive_entries c
        left join users creator on creator.id = c.created_by_user_id
        left join case_archive_contributors cc on cc.case_archive_entry_id = c.id
        left join users u on u.id = cc.user_id
        where c.unit_id = $2
          and c.id = $1
        group by c.id, creator.name
        limit 1
      `,
      [caseId, unitId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      ...mapCaseRecord(row),
      createdByUserId: row.created_by_user_id,
      createdByName: row.created_by_name,
      contributorUserIds: row.contributor_user_ids ?? [],
      whyThisCaseMatters: row.why_this_case_matters,
      keyDecisionPoints: row.key_decision_points,
      whatWentWell: row.what_went_well,
      whatCouldImprove: row.what_could_improve,
      takeHomePoints: row.take_home_points,
      relatedDocuments: await this.listRelatedDocuments(row.id),
      relatedLearningResources: await this.listRelatedLearningResources(row.id),
      similarCases: await this.listSimilarPublishedCases(
        unitId,
        row.id,
        row.specialty_area,
        row.anaesthesia_technique,
        row.tags
      )
    };
  }

  async listReviewComments(caseId: string): Promise<CaseReviewCommentRecord[]> {
    const result = await query<{
      id: string;
      comment: string;
      comment_type: string;
      created_at: string;
      author_name: string | null;
    }>(
      this.env,
      `
        select
          crc.id,
          crc.comment,
          crc.comment_type,
          crc.created_at::text,
          coalesce(nullif(u.display_name, ''), u.name) as author_name
        from case_review_comments crc
        left join users u on u.id = crc.author_user_id
        where crc.case_archive_entry_id = $1
        order by crc.created_at desc
      `,
      [caseId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      comment: row.comment,
      commentType: row.comment_type,
      createdAt: row.created_at,
      authorName: row.author_name
    }));
  }

  async create(
    unitId: string,
    createdByUserId: string,
    input: {
      title: string;
      subtitle: string;
      summary: string;
      learningPoints: string;
      whyThisCaseMatters: string;
      keyDecisionPoints: string;
      whatWentWell: string;
      whatCouldImprove: string;
      takeHomePoints: string;
      specialtyArea: string;
      anaesthesiaTechnique: string;
      urgency: string;
      patientAgeBand: string;
      complexityLevel: string;
      setting: string;
      hadCriticalEvent: boolean;
      status: string;
      tags: string[];
      contributorUserIds: string[];
      relatedDocumentIds: string[];
      relatedLearningResourceIds: string[];
    }
  ): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into case_archive_entries (
          id,
          unit_id,
          created_by_user_id,
          title,
          subtitle,
          summary,
          learning_points,
          why_this_case_matters,
          key_decision_points,
          what_went_well,
          what_could_improve,
          take_home_points,
          specialty_area,
          anaesthesia_technique,
          urgency,
          patient_age_band,
          complexity_level,
          setting,
          had_critical_event,
          status,
          tags
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      `,
      [
        id,
        unitId,
        createdByUserId,
        input.title,
        input.subtitle || null,
        input.summary,
        input.learningPoints,
        input.whyThisCaseMatters,
        input.keyDecisionPoints,
        input.whatWentWell,
        input.whatCouldImprove,
        input.takeHomePoints,
        input.specialtyArea,
        input.anaesthesiaTechnique,
        input.urgency,
        input.patientAgeBand,
        input.complexityLevel,
        input.setting,
        input.hadCriticalEvent,
        input.status,
        input.tags
      ]
    );

    for (const contributorUserId of input.contributorUserIds) {
      await query(
        this.env,
        `
          insert into case_archive_contributors (case_archive_entry_id, user_id)
          values ($1, $2)
          on conflict (case_archive_entry_id, user_id) do nothing
        `,
        [id, contributorUserId]
      );
    }

    for (const documentId of input.relatedDocumentIds) {
      await query(
        this.env,
        `
          insert into case_related_documents (case_archive_entry_id, document_id)
          values ($1, $2)
          on conflict (case_archive_entry_id, document_id) do nothing
        `,
        [id, documentId]
      );
    }

    for (const learningResourceId of input.relatedLearningResourceIds) {
      await query(
        this.env,
        `
          insert into case_related_learning_resources (case_archive_entry_id, learning_resource_id)
          values ($1, $2)
          on conflict (case_archive_entry_id, learning_resource_id) do nothing
        `,
        [id, learningResourceId]
      );
    }

    return id;
  }

  async addReviewComment(input: {
    caseId: string;
    authorUserId: string;
    comment: string;
    commentType: "note" | "suggestion";
  }): Promise<string> {
    const id = randomUUID();
    await query(
      this.env,
      `
        insert into case_review_comments (id, case_archive_entry_id, author_user_id, comment, comment_type)
        values ($1, $2, $3, $4, $5)
      `,
      [id, input.caseId, input.authorUserId, input.comment, input.commentType]
    );

    return id;
  }

  async updateStatus(caseId: string, status: string): Promise<void> {
    await query(
      this.env,
      `
        update case_archive_entries
        set status = $2
        where id = $1
      `,
      [caseId, status]
    );
  }

  async setFeatured(caseId: string, isFeatured: boolean): Promise<void> {
    await query(
      this.env,
      `
        update case_archive_entries
        set is_featured = $2
        where id = $1
      `,
      [caseId, isFeatured]
    );
  }

  private async listRelatedDocuments(caseId: string): Promise<Array<{ id: string; title: string }>> {
    const result = await query<{ id: string; title: string }>(
      this.env,
      `
        select d.id, d.title
        from case_related_documents crd
        inner join documents d on d.id = crd.document_id
        where crd.case_archive_entry_id = $1
        order by d.title asc
      `,
      [caseId]
    );

    return result.rows;
  }

  private async listRelatedLearningResources(
    caseId: string
  ): Promise<Array<{ id: string; title: string; resourceType: string }>> {
    const result = await query<{ id: string; title: string; resource_type: string }>(
      this.env,
      `
        select lr.id, lr.title, lr.resource_type
        from case_related_learning_resources crl
        inner join learning_resources lr on lr.id = crl.learning_resource_id
        where crl.case_archive_entry_id = $1
        order by lr.title asc
      `,
      [caseId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      resourceType: row.resource_type
    }));
  }

  private async listSimilarPublishedCases(
    unitId: string,
    caseId: string,
    specialtyArea: string,
    anaesthesiaTechnique: string,
    tags: string[]
  ): Promise<CaseArchiveRecord[]> {
    const result = await query<{
      id: string;
      title: string;
      subtitle: string | null;
      summary: string;
      learning_points: string;
      specialty_area: string;
      anaesthesia_technique: string;
      urgency: string;
      patient_age_band: string;
      complexity_level: string;
      setting: string;
      had_critical_event: boolean;
      is_featured: boolean;
      status: string;
      tags: string[];
      contributor_names: string[] | null;
      created_at: string;
    }>(
      this.env,
      `
        select
          c.id,
          c.title,
          c.subtitle,
          c.summary,
          c.learning_points,
          c.specialty_area,
          c.anaesthesia_technique,
          c.urgency,
          c.patient_age_band,
          c.complexity_level,
          c.setting,
          c.had_critical_event,
          c.is_featured,
          c.status,
          c.tags,
          c.created_at::text,
          coalesce(
            array_agg(distinct coalesce(nullif(u.display_name, ''), u.name))
              filter (where u.id is not null),
            '{}'
          ) as contributor_names
        from case_archive_entries c
        left join case_archive_contributors cc on cc.case_archive_entry_id = c.id
        left join users u on u.id = cc.user_id
        where c.unit_id = $1
          and c.status = 'published'
          and c.id <> $2
          and (
            c.specialty_area = $3
            or c.anaesthesia_technique = $4
            or c.tags && $5::text[]
          )
        group by c.id
        order by
          (
            case when c.specialty_area = $3 then 3 else 0 end
            + case when c.anaesthesia_technique = $4 then 2 else 0 end
            + case when c.tags && $5::text[] then 1 else 0 end
          ) desc,
          c.is_featured desc,
          c.created_at desc
        limit 4
      `,
      [unitId, caseId, specialtyArea, anaesthesiaTechnique, tags]
    );

    return result.rows.map(mapCaseRecord);
  }
}
