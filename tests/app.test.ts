import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

describe("app", () => {
  const app = createApp({
    NODE_ENV: "test",
    SESSION_SECRET: "123456789012",
    DATABASE_URL: "postgres://localhost/test"
  });

  it("returns health metadata", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it("renders the login page", async () => {
    const response = await request(app).get("/auth/login");

    expect(response.status).toBe(200);
    expect(response.text).toContain("Sign in");
  });
});
