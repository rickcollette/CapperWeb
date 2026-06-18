import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

const TS = Date.now();
const DB_NAME = `testdb${TS}`;
const STACK_NAME = `test-stack-${TS}`;

test.describe("Databases", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/databases");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Databases");
  });

  test("create form has name input and engine selector", async ({ page }) => {
    await expect(page.getByPlaceholder(/database name|name/i).first()).toBeVisible({ timeout: 8000 });
    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("option", { name: /postgres/i }).first()).toBeVisible();
    await expect(page.getByRole("option", { name: /redis/i }).first()).toBeVisible();
    await expect(page.getByRole("option", { name: /maria/i }).first()).toBeVisible();
  });

  test("Create Database button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create database/i })).toBeVisible({ timeout: 8000 });
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "Engine", "Status", "Created"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("create a postgres database and verify", async ({ page }) => {
    await page.getByPlaceholder(/database name|name/i).first().fill(DB_NAME);
    await page.locator("select").first().selectOption({ value: "postgres" });
    await page.getByRole("button", { name: /create database/i }).click();
    await expect(page.getByText(DB_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("delete confirmation dialog appears", async ({ page }) => {
    const delBtn = page.getByRole("button", { name: /delete/i }).first();
    if (await delBtn.count() === 0) { test.skip(); return; }
    await delBtn.click();
    await expect(page.getByText(/confirm|delete|are you sure/i).first()).toBeVisible({ timeout: 6000 });
  });
});

test.describe("Stacks", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/stacks");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Stacks");
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "Status", "Resources"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("empty state or stacks table renders", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no stacks/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("destroy button is present per stack", async ({ page }) => {
    const rows = page.locator("table tbody tr");
    if (await rows.count() === 0) { test.skip(); return; }
    await expect(page.getByRole("button", { name: /destroy/i }).first()).toBeVisible({ timeout: 6000 });
  });

  test("clicking stack navigates to detail", async ({ page }) => {
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/stacks\//);
    await expect(page.locator("nav")).toBeVisible();
  });
});

test.describe("Stack Detail", () => {
  test("renders resources table and Destroy Stack button", async ({ page }) => {
    await goto(page, "/stacks");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/stacks\//);
    await expect(page.getByText(/resources/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /destroy stack/i })).toBeVisible({ timeout: 8000 });
  });
});
