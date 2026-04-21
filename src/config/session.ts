import connectPgSimple from "connect-pg-simple";
import type { RequestHandler } from "express";
import session from "express-session";
import type { AppEnv } from "./env";
import { getPool } from "../db/pool";

export function buildSessionMiddleware(env: AppEnv): RequestHandler {
  if (env.NODE_ENV === "test" || env.SESSION_STORE_DRIVER === "memory") {
    return session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      name: env.SESSION_COOKIE_NAME
    });
  }

  const PgStore = connectPgSimple(session);

  return session({
    store: new PgStore({
      pool: getPool(env),
      tableName: "session"
    }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: env.SESSION_COOKIE_NAME,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 12
    }
  });
}
