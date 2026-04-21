import { test, expect } from "@playwright/test";

test.skip(!process.env.PLAYWRIGHT_BASE_URL, "PLAYWRIGHT_BASE_URL is not configured.");

test("home page responds", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Interconnected management/i })).toBeVisible();
});
