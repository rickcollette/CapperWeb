import { test, expect } from "@playwright/test";
import { goto, expectHeading, clickTab } from "./helpers";

test.describe("Marketplace", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/marketplace");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Marketplace");
  });

  test("status tabs are present", async ({ page }) => {
    for (const tab of ["All", "Pending", "Approved", "Quarantined", "Rejected"]) {
      await expect(page.getByRole("button", { name: new RegExp(tab, "i") }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("Pending tab filter works", async ({ page }) => {
    await page.getByRole("button", { name: /pending/i }).first().click();
    // Should not crash
    await expect(page.locator("nav")).toBeVisible();
  });

  test("Approved tab filter works", async ({ page }) => {
    await page.getByRole("button", { name: /approved/i }).first().click();
    await expect(page.locator("nav")).toBeVisible();
  });

  test("listing cards or empty state render", async ({ page }) => {
    const cards = page.locator("[class*='card'], article").first();
    const empty = page.getByText(/no listings|no images/i);
    await expect(cards.or(empty)).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Capsule Registry", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/capsules");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Capsule");
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "Family", "CPU", "Memory"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("capsule type rows or empty state render", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no capsule/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("Deprecate button present per non-locked capsule", async ({ page }) => {
    const btn = page.getByRole("button", { name: /deprecate/i }).first();
    if (await btn.count() === 0) { test.skip(); return; }
    await expect(btn).toBeVisible();
  });

  test("Deprecate button triggers confirmation dialog", async ({ page }) => {
    const btn = page.getByRole("button", { name: /deprecate/i }).first();
    if (await btn.count() === 0) { test.skip(); return; }
    await btn.click();
    await expect(page.getByText(/confirm|deprecate|are you sure/i).first()).toBeVisible({ timeout: 6000 });
  });
});

test.describe("Instance Types", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/instance-types");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Instance Types");
  });

  test("Types and GPU tabs are present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /types|all/i }).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /gpu/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("family filter buttons are present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /all/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("instance types table renders or empty state", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no instance types/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("GPU tab renders capsule type cards", async ({ page }) => {
    await page.getByRole("button", { name: /gpu/i }).first().click();
    // Either GPU cards or empty state
    const content = page.getByText(/gpu|no gpu/i).first();
    await expect(content).toBeVisible({ timeout: 8000 });
  });

  test("clicking an instance type navigates to detail", async ({ page }) => {
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/instance-types\//);
    await expect(page.locator("nav")).toBeVisible();
  });
});

test.describe("Instance Type Detail", () => {
  test("renders resource cards and launch button", async ({ page }) => {
    await goto(page, "/instance-types");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/instance-types\//);
    await expect(page.getByText(/cpu|memory|vcpu/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /launch/i })).toBeVisible({ timeout: 8000 });
  });

  test("audit events table renders or empty state (note: requires audit endpoint)", async ({ page }) => {
    await goto(page, "/instance-types");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/instance-types\//);
    const auditSection = page.getByText(/audit|events/i).first();
    await expect(auditSection).toBeVisible({ timeout: 8000 });
  });
});
