import { describe, expect, it } from "vitest";
import { hasPermission } from "../src/shared/permissions";

describe("permissions", () => {
  it("allows trainee write access to logbook but not admin console", () => {
    expect(hasPermission("postgraduate", "logbook:write")).toBe(true);
    expect(hasPermission("postgraduate", "admin:manage")).toBe(false);
  });

  it("allows faculty to read and manage documents", () => {
    expect(hasPermission("unit_admin_or_faculty", "documents:view")).toBe(true);
    expect(hasPermission("unit_admin_or_faculty", "documents:write")).toBe(true);
  });
});
