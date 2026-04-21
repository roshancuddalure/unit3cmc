import { describe, expect, it } from "vitest";
import { loadEnv } from "../src/config/env";

describe("loadEnv", () => {
  it("loads defaults and respects overrides", () => {
    const env = loadEnv({
      NODE_ENV: "test",
      SESSION_SECRET: "123456789012",
      DATABASE_URL: "postgres://localhost/test"
    });

    expect(env.NODE_ENV).toBe("test");
    expect(env.PORT).toBe(3000);
    expect(env.APP_NAME).toBe("Unit 3 Management System");
  });
});
