import type { AppEnv } from "../../config/env";
import { query } from "../../db/query";

export interface AuditEventInput {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
}

export class AuditRepository {
  constructor(private readonly env: AppEnv) {}

  async record(input: AuditEventInput): Promise<void> {
    await query(
      this.env,
      `
        insert into audit_events (actor_user_id, action, entity_type, entity_id, metadata)
        values ($1, $2, $3, $4, $5::jsonb)
      `,
      [input.actorUserId ?? null, input.action, input.entityType, input.entityId, JSON.stringify(input.metadata ?? {})]
    );
  }
}
