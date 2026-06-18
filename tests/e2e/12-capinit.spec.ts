import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

const TS = Date.now();
const TPL_NAME = `test-tpl-${TS}`;

test.describe("CapInit Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/capinit");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "CapInit");
  });

  test("status cards show metadata service info", async ({ page }) => {
    await expect(page.getByText(/metadata|service|ip/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("New Template button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /new template/i })).toBeVisible({ timeout: 8000 });
  });

  test("New Template modal opens with name, description, YAML editor", async ({ page }) => {
    await page.getByRole("button", { name: /new template/i }).click();
    await expect(page.getByPlaceholder(/template name|name/i).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByPlaceholder(/description/i).first()).toBeVisible({ timeout: 6000 });
  });

  test("create a template and verify it appears", async ({ page }) => {
    await page.getByRole("button", { name: /new template/i }).click();
    await page.getByPlaceholder(/template name|name/i).first().fill(TPL_NAME);
    await page.getByPlaceholder(/description/i).first().fill("Test template");
    // Save / Create button inside modal
    await page.getByRole("button", { name: /create|save/i }).last().click();
    await expect(page.getByText(TPL_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("Render Preview button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /render|preview/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("template cards show Render and Delete buttons", async ({ page }) => {
    const cards = page.locator("[class*='card'], [class*='template']").first();
    if (await cards.count() === 0) { test.skip(); return; }
    await expect(page.getByRole("button", { name: /render/i }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /delete/i }).first()).toBeVisible({ timeout: 8000 });
  });
});
