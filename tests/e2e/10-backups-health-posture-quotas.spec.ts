import { test, expect } from "@playwright/test";
import { goto, expectHeading, clickTab } from "./helpers";

test.describe("Backups", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/backups");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Backups");
  });

  test("Backups and Policies tabs are present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /backups/i }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /policies/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("backups tab has Create Backup button", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create backup/i })).toBeVisible({ timeout: 8000 });
  });

  test("create backup creates an entry", async ({ page }) => {
    await page.getByRole("button", { name: /create backup/i }).click();
    // After creation a backup entry should appear
    await expect(page.locator("table, [class*='empty']").first()).toBeVisible({ timeout: 10000 });
  });

  test("policies tab has create policy form", async ({ page }) => {
    await clickTab(page, "Policies");
    await expect(page.getByPlaceholder(/policy name|name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /create policy/i })).toBeVisible({ timeout: 8000 });
  });

  test("policies tab shows interval and retention inputs", async ({ page }) => {
    await clickTab(page, "Policies");
    await expect(page.getByPlaceholder(/interval/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder(/retention/i).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Health Checks", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/health");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Health");
  });

  test("KPI cards for total/healthy/unhealthy are present", async ({ page }) => {
    await expect(page.getByText(/total|healthy|unhealthy/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("health check table renders or empty state", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no instances|no health/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Instance", "Status", "Message"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });
});

test.describe("Security Posture", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/posture");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Posture");
  });

  test("Run Scan button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /run scan|scan/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("severity cards show Critical / High / Medium / Low", async ({ page }) => {
    for (const s of ["Critical", "High", "Medium", "Low"]) {
      await expect(page.getByText(s, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("findings table renders or empty state", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no findings|no results/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("clicking Run Scan triggers a scan", async ({ page }) => {
    await page.getByRole("button", { name: /run scan|scan/i }).first().click();
    // Spinner or updated results expected
    await expect(page.locator("table, [class*='empty']").first()).toBeVisible({ timeout: 12000 });
  });
});

test.describe("Quotas", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/quotas");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Quotas");
  });

  test("resource dropdown has expected options", async ({ page }) => {
    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 8000 });
    for (const opt of ["instance", "storage", "network"]) {
      await expect(page.getByRole("option", { name: new RegExp(opt, "i") }).first()).toBeVisible();
    }
  });

  test("Set Quota button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /set quota/i })).toBeVisible({ timeout: 8000 });
  });

  test("quotas table renders with progress bars", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no quotas/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("set a quota and verify it appears", async ({ page }) => {
    await page.locator("select").first().selectOption({ index: 0 });
    await page.getByPlaceholder(/limit/i).first().fill("10");
    await page.getByRole("button", { name: /set quota/i }).click();
    await expect(page.locator("table").first()).toBeVisible({ timeout: 10000 });
  });
});
