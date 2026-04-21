import type { QueryResult, QueryResultRow } from "pg";
import type { AppEnv } from "../config/env";
import { getPool } from "./pool";

export async function query<T extends QueryResultRow>(
  env: AppEnv,
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  return getPool(env).query<T>(text, params);
}
