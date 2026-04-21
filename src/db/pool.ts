import { Pool } from "pg";
import type { AppEnv } from "../config/env";

let pool: Pool | null = null;

export function getPool(env: AppEnv): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL
    });
  }

  return pool;
}
