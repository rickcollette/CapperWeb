import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

const TS = Date.now();
const ZONE_NAME = `test${TS}.local`;

test.describe("DNS Zones", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/dns");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "DNS");
  });

  test("create zone form has name input and button", async ({ page }) => {
    await expect(page.getByPlaceholder(/zone|name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /create/i }).first()).toBeVisible();
  });

  test("query tester section is present", async ({ page }) => {
    await expect(page.getByText(/query|test/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("query type selector has DNS types", async ({ page }) => {
    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("option", { name: "A", exact: true })).toBeVisible();
    await expect(page.getByRole("option", { name: "AAAA" }).first()).toBeVisible();
    await expect(page.getByRole("option", { name: "CNAME" })).toBeVisible();
    await expect(page.getByRole("option", { name: "TXT" })).toBeVisible();
    await expect(page.getByRole("option", { name: "MX" })).toBeVisible();
  });

  test("create a zone and verify it appears", async ({ page }) => {
    await page.getByPlaceholder(/zone|name/i).first().fill(ZONE_NAME);
    await page.getByRole("button", { name: /create/i }).first().click();
    await expect(page.getByText(ZONE_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("DNS query submit button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /query/i })).toBeVisible({ timeout: 6000 });
  });

  test("clicking a zone navigates to zone detail", async ({ page }) => {
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/dns\//);
    await expect(page.locator("nav")).toBeVisible();
  });
});

test.describe("DNS Zone Detail", () => {
  test("renders create record form with type selector", async ({ page }) => {
    await goto(page, "/dns");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/dns\//);

    // Record type selector
    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 8000 });

    // Add record button
    await expect(page.getByRole("button", { name: /add record/i })).toBeVisible({ timeout: 8000 });
  });

  test("records table renders or empty state shows", async ({ page }) => {
    await goto(page, "/dns");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/dns\//);
    const table = page.locator("table");
    const empty = page.getByText(/no records/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("can create a DNS A record", async ({ page }) => {
    await goto(page, "/dns");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/dns\//);

    await page.getByPlaceholder(/record name|name/i).first().fill("www");
    await page.getByPlaceholder(/value|address/i).first().fill("1.2.3.4");
    await page.getByRole("button", { name: /add record/i }).click();
    await expect(page.getByText("www", { exact: false }).first()).toBeVisible({ timeout: 8000 });
  });
});
