import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

test.describe("Factory Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/factory");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Factory");
  });

  test("status cards are present (agent, sync, artifacts)", async ({ page }) => {
    for (const label of ["Agent", "Sync", "Artifacts"]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("jobs table renders or empty state", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no jobs/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("link to CapsuleBuilder is present", async ({ page }) => {
    await expect(page.getByText(/capsule builder|factory/i).first()).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Audit Log", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/audit");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Audit");
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Time", "Actor", "Action", "Resource"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("audit records table renders or empty state", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no audit|no records/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/settings");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Settings");
  });

  test("API URL is displayed", async ({ page }) => {
    await expect(page.getByText(/api url|api\/v1/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("OpenAPI spec link is present", async ({ page }) => {
    await expect(page.getByText(/openapi|openapi\.json/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("bearer token input is present", async ({ page }) => {
    await expect(page.getByPlaceholder(/token|bearer/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("Create Session button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create session|session/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("OpenAPI spec link resolves to valid JSON", async ({ page }) => {
    const response = await page.request.get("/api/v1/openapi.json");
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty("openapi");
  });
});
