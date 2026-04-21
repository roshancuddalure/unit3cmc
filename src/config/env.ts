import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  APP_NAME: z.string().min(1).default("Unit 3 Management System"),
  APP_BASE_URL: z.url().default("http://localhost:3000"),
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@localhost:5432/unit3_management"),
  DATABASE_ADMIN_URL: z.string().optional(),
  SESSION_SECRET: z.string().min(12, "SESSION_SECRET must be at least 12 characters long."),
  SESSION_COOKIE_NAME: z.string().min(1).default("unit3.sid"),
  SESSION_STORE_DRIVER: z.enum(["memory", "postgres"]).default("memory"),
  LOGIN_THROTTLE_MAX_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOGIN_THROTTLE_WINDOW_MINUTES: z.coerce.number().int().positive().default(15),
  LOGIN_THROTTLE_LOCKOUT_MINUTES: z.coerce.number().int().positive().default(15),
  DEFAULT_UNIT_CODE: z.string().min(1).default("UNIT3"),
  DEFAULT_UNIT_NAME: z.string().min(1).default("Unit 3 Anaesthesia"),
  AWS_REGION: z.string().min(1).default("ap-south-1"),
  AWS_S3_BUCKET: z.string().min(1).default("unit3-documents"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  BOOTSTRAP_ADMIN_NAME: z.string().min(1).default("Unit 3 Admin"),
  BOOTSTRAP_ADMIN_USERNAME: z.string().min(1).default("unitchief"),
  BOOTSTRAP_ADMIN_EMAIL: z.email().default("admin@unit3.local"),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().min(8).default("liverteam3")
});

export type AppEnv = z.infer<typeof envSchema>;

export function loadEnv(overrides?: Partial<NodeJS.ProcessEnv>): AppEnv {
  return envSchema.parse({
    ...process.env,
    ...overrides
  });
}
