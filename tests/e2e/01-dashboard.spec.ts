import { test, expect } from "@playwright/test";
import { goto } from "./helpers";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/");
  });

  test("renders KPI cards", async ({ page }) => {
    // Running / Stopped / Failed / Images / Networks
    await expect(page.getByText("Running", { exact: false }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText("Stopped", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Failed", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Images", { exact: false }).first()).toBeVisible();
    await expect(page.getByText("Networks", { exact: false }).first()).toBeVisible();
  });

  test("renders daemon status badge", async ({ page }) => {
    // DaemonBadge is present in the header
    const badge = page.getByText(/daemon|online|offline/i).first();
    await expect(badge).toBeVisible({ timeout: 8000 });
  });

  test("renders instance state chart or empty state", async ({ page }) => {
    // Either a recharts svg or an empty state message
    const chart = page.locator("svg.recharts-surface").first();
    const empty = page.getByText(/no instances/i).first();
    await expect(chart.or(empty).first()).toBeVisible({ timeout: 8000 });
  });

  test("renders recent activity section", async ({ page }) => {
    await expect(page.getByText(/recent activity|activity/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("renders recent instances section", async ({ page }) => {
    await expect(page.getByText(/instances/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("renders storage summary section", async ({ page }) => {
    await expect(page.getByText(/storage/i).first()).toBeVisible({ timeout: 8000 });
  });
});
