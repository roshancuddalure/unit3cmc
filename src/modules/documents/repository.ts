import { randomUUID } from "crypto";
import type { AppEnv } from "../../config/env";
import { query } from "../../db/query";

export interface DocumentListFilters {
  search?: string;
  category?: string;
  status?: string;
}

export interface DocumentListItem {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  scopeArea: string | null;
  status: string;
  visibility: string;
  latestVersion: string;
  updatedAt: string;
  effectiveDate: string | null;
}

export interface DocumentDetail {
  id: string;
  title: string;
  subtitle: string | null;
  category: string;
  scopeArea: string | null;
  status: string;
  visibility: string;
  latestVersion: string;
  updatedAt: string;
  effectiveDate: string | null;
  reviewDueDate: string | null;
}

export interface DocumentVersionItem {
  id: string;
  versionNumber: number;
  versionNotes: string;
  changeSummary: string;
  contentHtml: string;
  originalFileName: string;
  createdAt: string;
  submittedForReviewAt: string | null;
  approvedAt: string | null;
}

export interface ReviewEventItem {
  id: string;
  decision: string;
  comments: string;
  createdAt: string;
  actorName: string | null;
}

export class DocumentsRepository {
  constructor(private readonly env: AppEnv) {}

  async list(unitId: string, filters: DocumentListFilters): Promise<DocumentListItem[]> {
    const params: unknown[] = [unitId];
    const clauses = ["d.unit_id = $1", "d.document_type = 'sop'"];

    if (filters.search?.trim()) {
      params.push(`%${filters.search.trim()}%`);
      const idx = params.length;
      clauses.push(`(d.title ilike $${idx} or coalesce(d.subtitle, '') ilike $${idx} or coalesce(d.scope_area, '') ilike $${idx})`);
    }

    if (filters.category?.trim()) {
      params.push(filters.category.trim());
      clauses.push(`d.category = $${params.length}`);
    }

    if (filters.status?.trim()) {
      params.push(filters.status.trim());
      clauses.push(`d.status = $${params.length}`);
    }

    const result = await query<{
      id: string;
      title: string;
      subtitle: string | null;
      category: string;
      scope_area: string | null;
      status: string;
      visibility: string;
      latest_version: string;
      updated_at: string;
      effective_date: string | null;
    }>(
      this.env,
      `
        select
          d.id,
          d.title,
          d.subtitle,
          d.category,
          d.scope_area,
          d.status,
          d.visibility,
          coalesce(max(v.version_number)::text, '0') as latest_version,
          d.updated_at::text,
          d.effective_date::text
        from documents d
        left join document_versions v on v.document_id = d.id
        where ${clauses.join(" and ")}
        group by d.id
        order by d.updated_at desc, d.title asc
      `,
      params
    );

    return result.rows.map((row) => ({
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      category: row.category,
      scopeArea: row.scope_area,
      status: row.status,
      visibility: row.visibility,
      latestVersion: row.latest_version,
      updatedAt: row.updated_at,
      effectiveDate: row.effective_date
    }));
  }

  async listCategories(unitId: string): Promise<string[]> {
    const result = await query<{ category: string }>(
      this.env,
      `
        select distinct category
        from documents
        where unit_id = $1 and document_type = 'sop'
        order by category asc
      `,
      [unitId]
    );

    return result.rows.map((row) => row.category);
  }

  async getById(documentId: string): Promise<DocumentDetail | null> {
    const result = await query<{
      id: string;
      title: string;
      subtitle: string | null;
      category: string;
      scope_area: string | null;
      status: string;
      visibility: string;
      latest_version: string;
      updated_at: string;
      effective_date: string | null;
      review_due_date: string | null;
    }>(
      this.env,
      `
        select
          d.id,
          d.title,
          d.subtitle,
          d.category,
          d.scope_area,
          d.status,
          d.visibility,
          coalesce(max(v.version_number)::text, '0') as latest_version,
          d.updated_at::text,
          d.effective_date::text,
          d.review_due_date::text
        from documents d
        left join document_versions v on v.document_id = d.id
        where d.id = $1 and d.document_type = 'sop'
        group by d.id
      `,
      [documentId]
    );

    const row = result.rows[0];
    if (!row) {
      return null;
    }

    return {
      id: row.id,
      title: row.title,
      subtitle: row.subtitle,
      category: row.category,
      scopeArea: row.scope_area,
      status: row.status,
      visibility: row.visibility,
      latestVersion: row.latest_version,
      updatedAt: row.updated_at,
      effectiveDate: row.effective_date,
      reviewDueDate: row.review_due_date
    };
  }

  async listVersions(documentId: string): Promise<DocumentVersionItem[]> {
    const result = await query<{
      id: string;
      version_number: number;
      version_notes: string;
      change_summary: string;
      content_html: string;
      original_file_name: string;
      created_at: string;
      submitted_for_review_at: string | null;
      approved_at: string | null;
    }>(
      this.env,
      `
        select
          id,
          version_number,
          version_notes,
          change_summary,
          content_html,
          original_file_name,
          created_at::text,
          submitted_for_review_at::text,
          approved_at::text
        from document_versions
        where document_id = $1
        order by version_number desc
      `,
      [documentId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      versionNumber: row.version_number,
      versionNotes: row.version_notes,
      changeSummary: row.change_summary,
      contentHtml: row.content_html,
      originalFileName: row.original_file_name,
      createdAt: row.created_at,
      submittedForReviewAt: row.submitted_for_review_at,
      approvedAt: row.approved_at
    }));
  }

  async listReviewEvents(documentId: string): Promise<ReviewEventItem[]> {
    const result = await query<{
      id: string;
      decision: string;
      comments: string;
      created_at: string;
      actor_name: string | null;
    }>(
      this.env,
      `
        select
          e.id,
          e.decision,
          e.comments,
          e.created_at::text,
          u.name as actor_name
        from sop_review_events e
        left join users u on u.id = e.actor_user_id
        where e.document_id = $1
        order by e.created_at desc
      `,
      [documentId]
    );

    return result.rows.map((row) => ({
      id: row.id,
      decision: row.decision,
      comments: row.comments,
      createdAt: row.created_at,
      actorName: row.actor_name
    }));
  }

  async createInitialVersion(input: {
    unitId: string;
    authorUserId: string;
    title: string;
    subtitle?: string;
    category: string;
    scopeArea?: string;
    visibility: string;
    effectiveDate?: string;
    reviewDueDate?: string;
    versionNotes: string;
    changeSummary: string;
    contentHtml: string;
    storageKey: string;
    originalFileName: string;
    status: string;
  }): Promise<string> {
    const documentId = randomUUID();
    const versionId = randomUUID();

    await query(
      this.env,
      `
        insert into documents (
          id, unit_id, title, subtitle, category, scope_area, visibility, owner_user_id, status,
          effective_date, review_due_date, document_type, current_version_id, updated_at, published_at
        )
        values (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9::text,
          $10,
          $11,
          'sop',
          $12,
          now(),
          case when $9::text = 'published' then now() else null end
        )
      `,
      [
        documentId,
        input.unitId,
        input.title,
        input.subtitle ?? null,
        input.category,
        input.scopeArea ?? null,
        input.visibility,
        input.authorUserId,
        input.status,
        input.effectiveDate || null,
        input.reviewDueDate || null,
        versionId
      ]
    );

    await query(
      this.env,
      `
        insert into document_versions (
          id, document_id, version_number, version_notes, change_summary, content_html, storage_key,
          original_file_name, created_by_user_id, submitted_for_review_at, approved_at
        )
        values ($1, $2, 1, $3, $4, $5, $6, $7, $8,
          case when $9::text = 'in_review' then now() else null end,
          case when $9::text in ('approved', 'published') then now() else null end
        )
      `,
      [
        versionId,
        documentId,
        input.versionNotes,
        input.changeSummary,
        input.contentHtml,
        input.storageKey,
        input.originalFileName,
        input.authorUserId,
        input.status
      ]
    );

    return documentId;
  }

  async appendVersion(input: {
    documentId: string;
    authorUserId: string;
    versionNotes: string;
    changeSummary: string;
    contentHtml: string;
    storageKey: string;
    originalFileName: string;
    status: string;
  }): Promise<string> {
    const versionId = randomUUID();

    await query(
      this.env,
      `
        insert into document_versions (
          id, document_id, version_number, version_notes, change_summary, content_html, storage_key,
          original_file_name, created_by_user_id, submitted_for_review_at, approved_at
        )
        values (
          $1,
          $2,
          (select coalesce(max(version_number), 0) + 1 from document_versions where document_id = $2),
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          case when $9::text = 'in_review' then now() else null end,
          case when $9::text in ('approved', 'published') then now() else null end
        )
      `,
      [
        versionId,
        input.documentId,
        input.versionNotes,
        input.changeSummary,
        input.contentHtml,
        input.storageKey,
        input.originalFileName,
        input.authorUserId,
        input.status
      ]
    );

    await query(
      this.env,
      `
        update documents
        set
          current_version_id = $2,
          status = $3::text,
          updated_at = now(),
          published_at = case when $3::text = 'published' then now() else published_at end,
          archived_at = case when $3::text = 'archived' then now() else archived_at end
        where id = $1
      `,
      [input.documentId, versionId, input.status]
    );

    return versionId;
  }

  async updateStatus(documentId: string, status: string): Promise<void> {
    await query(
      this.env,
      `
        update documents
        set
          status = $2::text,
          updated_at = now(),
          published_at = case when $2::text = 'published' then now() else published_at end,
          archived_at = case when $2::text = 'archived' then now() else archived_at end
        where id = $1
      `,
      [documentId, status]
    );
  }

  async addReviewEvent(input: {
    documentId: string;
    versionId?: string;
    actorUserId: string;
    decision: string;
    comments: string;
  }): Promise<void> {
    await query(
      this.env,
      `
        insert into sop_review_events (id, document_id, version_id, actor_user_id, decision, comments)
        values ($1, $2, $3, $4, $5, $6)
      `,
      [randomUUID(), input.documentId, input.versionId ?? null, input.actorUserId, input.decision, input.comments]
    );
  }
}
