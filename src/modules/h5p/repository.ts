import type { AppEnv } from "../../config/env";
import { getPool } from "../../db/pool";
import { query } from "../../db/query";

export interface H5PContentSummary {
  contentId: string;
  title: string;
  libraryName: string;
  updatedAt: string;
  resourceId: string | null;
  resourceStatus: string | null;
  resourceTitle: string | null;
}

export class H5PRepository {
  constructor(private readonly env: AppEnv) {}

  async upsertContent(input: {
    contentId: string;
    unitId: string;
    title: string;
    libraryName: string;
    parametersJson: unknown;
    metadataJson: unknown;
    createdByUserId: string;
  }): Promise<void> {
    await query(
      this.env,
      `
        insert into h5p_content (
          content_id,
          unit_id,
          title,
          library_name,
          parameters_json,
          metadata_json,
          created_by_user_id
        )
        values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7)
        on conflict (content_id)
        do update set
          unit_id = excluded.unit_id,
          title = excluded.title,
          library_name = excluded.library_name,
          parameters_json = excluded.parameters_json,
          metadata_json = excluded.metadata_json,
          updated_at = current_timestamp
      `,
      [
        input.contentId,
        input.unitId,
        input.title,
        input.libraryName,
        JSON.stringify(input.parametersJson ?? {}),
        JSON.stringify(input.metadataJson ?? {}),
        input.createdByUserId
      ]
    );
  }

  async listContent(unitId: string): Promise<H5PContentSummary[]> {
    const result = await query<{
      content_id: string;
      title: string;
      library_name: string;
      updated_at: string;
      resource_id: string | null;
      resource_status: string | null;
      resource_title: string | null;
    }>(
      this.env,
      `
        select
          h.content_id,
          h.title,
          h.library_name,
          h.updated_at::text,
          lr.id as resource_id,
          lr.status as resource_status,
          lr.title as resource_title
        from h5p_content h
        left join learning_resources lr
          on lr.unit_id = h.unit_id
         and lr.h5p_content_id = h.content_id
        where h.unit_id = $1
        order by h.updated_at desc, h.title asc
      `,
      [unitId]
    );

    return result.rows.map((row) => ({
      contentId: row.content_id,
      title: row.title,
      libraryName: row.library_name,
      updatedAt: row.updated_at,
      resourceId: row.resource_id,
      resourceStatus: row.resource_status,
      resourceTitle: row.resource_title
    }));
  }

  async ensureLearningResource(input: {
    unitId: string;
    createdByUserId: string;
    contentId: string;
    title: string;
    description: string;
    metadataJson: unknown;
  }): Promise<void> {
    await query(
      this.env,
      `
        insert into learning_resources (
          id,
          unit_id,
          created_by_user_id,
          title,
          description,
          resource_type,
          source_url,
          h5p_content_id,
          metadata_json,
          status
        )
        values (
          gen_random_uuid(),
          $1,
          $2,
          $3,
          $4,
          'h5p',
          $5,
          $6,
          $7::jsonb,
          'published'
        )
        on conflict (unit_id, h5p_content_id)
        do update set
          title = excluded.title,
          description = excluded.description,
          source_url = excluded.source_url,
          metadata_json = excluded.metadata_json,
          status = 'published'
      `,
      [
        input.unitId,
        input.createdByUserId,
        input.title,
        input.description,
        `/api/h5p/play/${input.contentId}`,
        input.contentId,
        JSON.stringify(input.metadataJson ?? {})
      ]
    );
  }

  async updateLinkedResourceStatus(unitId: string, contentId: string, status: string): Promise<void> {
    await query(
      this.env,
      `
        update learning_resources
        set status = $3
        where unit_id = $1 and h5p_content_id = $2
      `,
      [unitId, contentId, status]
    );
  }

  async resolveCanonicalContentId(unitId: string, requestedContentId: string): Promise<string | null> {
    const direct = await query<{ content_id: string }>(
      this.env,
      `
        select content_id
        from h5p_content
        where unit_id = $1 and content_id = $2
        limit 1
      `,
      [unitId, requestedContentId]
    );

    if (direct.rows[0]?.content_id) {
      return direct.rows[0].content_id;
    }

    const alias = await query<{ canonical_content_id: string }>(
      this.env,
      `
        select a.canonical_content_id
        from h5p_content_aliases a
        inner join h5p_content h on h.content_id = a.canonical_content_id
        where h.unit_id = $1 and a.alias_content_id = $2
        limit 1
      `,
      [unitId, requestedContentId]
    );

    return alias.rows[0]?.canonical_content_id ?? null;
  }

  async createAlias(aliasContentId: string, canonicalContentId: string): Promise<void> {
    if (aliasContentId === canonicalContentId) {
      return;
    }

    await query(
      this.env,
      `
        insert into h5p_content_aliases (alias_content_id, canonical_content_id)
        values ($1, $2)
        on conflict (alias_content_id)
        do update set canonical_content_id = excluded.canonical_content_id
      `,
      [aliasContentId, canonicalContentId]
    );
  }

  async getDeletionScope(
    unitId: string,
    contentId: string
  ): Promise<{ title: string; relatedContentIds: string[] } | null> {
    const contentResult = await query<{ title: string }>(
      this.env,
      `
        select title
        from h5p_content
        where unit_id = $1 and content_id = $2
        limit 1
      `,
      [unitId, contentId]
    );

    const title = contentResult.rows[0]?.title;
    if (!title) {
      return null;
    }

    const aliasResult = await query<{ alias_content_id: string }>(
      this.env,
      `
        select alias_content_id
        from h5p_content_aliases
        where canonical_content_id = $1
        order by created_at asc
      `,
      [contentId]
    );

    return {
      title,
      relatedContentIds: [contentId, ...aliasResult.rows.map((row) => row.alias_content_id)]
    };
  }

  async deleteContentGraph(
    unitId: string,
    relatedContentIds: string[]
  ): Promise<{ deletedContentCount: number; deletedLearningResourceCount: number; deletedXapiEventCount: number }> {
    if (!relatedContentIds.length) {
      return {
        deletedContentCount: 0,
        deletedLearningResourceCount: 0,
        deletedXapiEventCount: 0
      };
    }

    const client = await getPool(this.env).connect();

    try {
      await client.query("begin");

      const deletedXapiEvents = await client.query<{ h5p_content_id: string }>(
        `
          delete from h5p_xapi_events
          where unit_id = $1 and h5p_content_id = any($2::text[])
          returning h5p_content_id
        `,
        [unitId, relatedContentIds]
      );

      const deletedLearningResources = await client.query<{ id: string }>(
        `
          delete from learning_resources
          where unit_id = $1 and h5p_content_id = any($2::text[])
          returning id
        `,
        [unitId, relatedContentIds]
      );

      await client.query(
        `
          delete from h5p_content_aliases
          where alias_content_id = any($1::text[])
             or canonical_content_id = any($1::text[])
        `,
        [relatedContentIds]
      );

      const deletedContent = await client.query<{ content_id: string }>(
        `
          delete from h5p_content
          where unit_id = $1 and content_id = any($2::text[])
          returning content_id
        `,
        [unitId, relatedContentIds]
      );

      await client.query("commit");

      return {
        deletedContentCount: deletedContent.rowCount ?? 0,
        deletedLearningResourceCount: deletedLearningResources.rowCount ?? 0,
        deletedXapiEventCount: deletedXapiEvents.rowCount ?? 0
      };
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async recordXapiEvent(input: {
    unitId: string;
    userId: string;
    contentId: string;
    verb: string;
    resultJson: unknown;
    statementJson: unknown;
  }): Promise<void> {
    const linkedResource = await query<{ id: string }>(
      this.env,
      `
        select id
        from learning_resources
        where unit_id = $1 and h5p_content_id = $2
        limit 1
      `,
      [input.unitId, input.contentId]
    );

    await query(
      this.env,
      `
        insert into h5p_xapi_events (
          unit_id,
          user_id,
          learning_resource_id,
          h5p_content_id,
          verb,
          result_json,
          statement_json
        )
        values ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb)
      `,
      [
        input.unitId,
        input.userId,
        linkedResource.rows[0]?.id ?? null,
        input.contentId,
        input.verb,
        JSON.stringify(input.resultJson ?? {}),
        JSON.stringify(input.statementJson ?? {})
      ]
    );
  }

  async getLinkedLearningResourceIds(unitId: string, contentId: string): Promise<string[]> {
    const result = await query<{ id: string }>(
      this.env,
      `
        select id
        from learning_resources
        where unit_id = $1 and h5p_content_id = $2
      `,
      [unitId, contentId]
    );

    return result.rows.map((row) => row.id);
  }

  async getHealth(unitId: string): Promise<{
    contentCount: number;
    linkedResourceCount: number;
    xapiCount: number;
    unknownXapiCount: number;
  }> {
    const result = await query<{
      content_count: string;
      linked_resource_count: string;
      xapi_count: string;
      unknown_xapi_count: string;
    }>(
      this.env,
      `
        select
          (select count(*)::text from h5p_content where unit_id = $1) as content_count,
          (select count(*)::text from learning_resources where unit_id = $1 and h5p_content_id is not null) as linked_resource_count,
          (select count(*)::text from h5p_xapi_events where unit_id = $1) as xapi_count,
          (
            select count(*)::text
            from h5p_xapi_events e
            left join h5p_content h on h.content_id = e.h5p_content_id
            where e.unit_id = $1
              and h.content_id is null
          ) as unknown_xapi_count
      `,
      [unitId]
    );

    const row = result.rows[0];
    return {
      contentCount: Number(row?.content_count ?? 0),
      linkedResourceCount: Number(row?.linked_resource_count ?? 0),
      xapiCount: Number(row?.xapi_count ?? 0),
      unknownXapiCount: Number(row?.unknown_xapi_count ?? 0)
    };
  }

  async listUnknownXapiReferences(unitId: string): Promise<Array<{ contentId: string; events: number }>> {
    const result = await query<{ h5p_content_id: string; events: string }>(
      this.env,
      `
        select e.h5p_content_id, count(*)::text as events
        from h5p_xapi_events e
        left join h5p_content h on h.content_id = e.h5p_content_id
        where e.unit_id = $1
          and h.content_id is null
        group by e.h5p_content_id
        order by count(*) desc
      `,
      [unitId]
    );

    return result.rows.map((row) => ({
      contentId: row.h5p_content_id,
      events: Number(row.events)
    }));
  }
}
