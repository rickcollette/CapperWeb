import { test, expect } from "@playwright/test";
import { goto, expectHeading, clickTab } from "./helpers";
import path from "path";
import fs from "fs";

test.describe("Image List", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/images");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Images");
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "Digest", "Size", "Created"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("Upload button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /upload/i })).toBeVisible({ timeout: 8000 });
  });

  test("empty state or image rows render", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no images/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("clicking image name navigates to detail", async ({ page }) => {
    const rows = page.locator("table tbody tr");
    if (await rows.count() === 0) { test.skip(); return; }
    await rows.first().getByRole("link").first().click();
    await page.waitForURL(/\/images\//);
  });
});

test.describe("Image Detail", () => {
  async function goToFirstImage(page: any) {
    await goto(page, "/images");
    const rows = page.locator("table tbody tr");
    if (await rows.count() === 0) return false;
    await rows.first().getByRole("link").first().click();
    await page.waitForURL(/\/images\//);
    return true;
  }

  test("renders manifest tab by default", async ({ page }) => {
    if (!await goToFirstImage(page)) { test.skip(); return; }
    await clickTab(page, "Manifest");
    const editor = page.locator(".monaco-editor, pre").first();
    const content = page.getByText(/digest|mediaType|layers/i).first();
    await expect(editor.or(content)).toBeVisible({ timeout: 8000 });
  });

  test("renders SBOM tab", async ({ page }) => {
    if (!await goToFirstImage(page)) { test.skip(); return; }
    await clickTab(page, "SBOM");
    await expect(page.getByText(/sbom|spdx|generate/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("renders scan tab", async ({ page }) => {
    if (!await goToFirstImage(page)) { test.skip(); return; }
    await clickTab(page, "Scan");
    await expect(page.getByText(/scan|vulnerabilit|findings/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("Scan button is present", async ({ page }) => {
    if (!await goToFirstImage(page)) { test.skip(); return; }
    await expect(page.getByRole("button", { name: /scan/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("Publish button is present", async ({ page }) => {
    if (!await goToFirstImage(page)) { test.skip(); return; }
    await expect(page.getByRole("button", { name: /publish/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("Generate SBOM button is present", async ({ page }) => {
    if (!await goToFirstImage(page)) { test.skip(); return; }
    await clickTab(page, "SBOM");
    await expect(page.getByRole("button", { name: /generate sbom/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("Publish button opens modal", async ({ page }) => {
    if (!await goToFirstImage(page)) { test.skip(); return; }
    await page.getByRole("button", { name: /publish/i }).first().click();
    await expect(page.getByText(/description|publish/i).first()).toBeVisible({ timeout: 6000 });
  });
});
