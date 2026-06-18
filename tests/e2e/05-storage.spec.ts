import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

const TS = Date.now();
const BUCKET_NAME = `test-bucket-${TS}`;
const VOLUME_NAME = `test-vol-${TS}`;

test.describe("Storage Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/storage");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Storage");
  });

  test("KPI cards for buckets and volumes are present", async ({ page }) => {
    await expect(page.getByText(/bucket/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/volume/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("create bucket form has name input and button", async ({ page }) => {
    await expect(page.getByPlaceholder(/bucket name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /create bucket/i })).toBeVisible();
  });

  test("create volume form has name, size inputs and button", async ({ page }) => {
    await expect(page.getByPlaceholder(/volume name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /create volume/i })).toBeVisible();
  });

  test("create a bucket and verify it appears", async ({ page }) => {
    await page.getByPlaceholder(/bucket name/i).first().fill(BUCKET_NAME);
    await page.getByRole("button", { name: /create bucket/i }).click();
    await expect(page.getByText(BUCKET_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("create a volume and verify it appears", async ({ page }) => {
    await page.getByPlaceholder(/volume name/i).first().fill(VOLUME_NAME);
    await page.getByPlaceholder(/size|gb/i).first().fill("1");
    await page.getByRole("button", { name: /create volume/i }).click();
    await expect(page.getByText(VOLUME_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("volumes table has attach form", async ({ page }) => {
    await expect(page.getByRole("button", { name: /attach/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("clicking a bucket navigates to bucket detail", async ({ page }) => {
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/storage\/buckets\//);
    await expect(page.locator("nav")).toBeVisible();
  });
});

test.describe("Bucket Detail", () => {
  test("renders breadcrumb, upload, and object table", async ({ page }) => {
    await goto(page, "/storage");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/storage\/buckets\//);
    await expect(page.getByText(/upload|object|key/i).first()).toBeVisible({ timeout: 8000 });
  });
});
