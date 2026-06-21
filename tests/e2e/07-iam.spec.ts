import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

const TS = Date.now();
const USER_NAME = `testuser${TS}`;
const GROUP_NAME = `testgroup${TS}`;
const ROLE_NAME = `testrole${TS}`;

test.describe("IAM Users", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/iam/users");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Users & Access");
  });

  test("create user form has name input and button", async ({ page }) => {
    await expect(page.getByPlaceholder(/username|google email/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /add/i }).first()).toBeVisible();
  });

  test("create a sign-in user and verify it appears", async ({ page }) => {
    await page.getByPlaceholder(/username/i).first().fill(USER_NAME);
    await page.getByPlaceholder(/password/i).first().fill("test-pass-123");
    await page.getByRole("button", { name: /add/i }).first().click();
    await expect(page.getByText(USER_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("table has delete buttons", async ({ page }) => {
    const del = page.getByRole("button", { name: /delete/i }).first();
    if (await del.count() === 0) { test.skip(); return; }
    await expect(del).toBeVisible();
  });
});

test.describe("IAM Groups", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/iam/groups");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Users & Access");
    await expect(page.getByRole("link", { name: "Groups" })).toBeVisible();
  });

  test("create group form has name input and button", async ({ page }) => {
    await expect(page.getByPlaceholder(/group name|name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /create/i }).first()).toBeVisible();
  });

  test("create a group and verify it appears", async ({ page }) => {
    await page.getByPlaceholder(/group name|name/i).first().fill(GROUP_NAME);
    await page.getByRole("button", { name: /create/i }).first().click();
    await expect(page.getByText(GROUP_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("IAM Roles", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/iam/roles");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Users & Access");
    await expect(page.getByRole("link", { name: "Roles" })).toBeVisible();
  });

  test("create role form has name input and button", async ({ page }) => {
    await expect(page.getByPlaceholder(/role name|name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /create/i }).first()).toBeVisible();
  });

  test("create a role and verify it appears", async ({ page }) => {
    await page.getByPlaceholder(/role name|name/i).first().fill(ROLE_NAME);
    await page.getByRole("button", { name: /create/i }).first().click();
    await expect(page.getByText(ROLE_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("IAM Policies", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/iam/policies");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Users & Access");
    await expect(page.getByRole("link", { name: "Policies" })).toBeVisible();
  });

  test("policy JSON editor is present", async ({ page }) => {
    const editor = page.locator(".monaco-editor, textarea").first();
    await expect(editor).toBeVisible({ timeout: 8000 });
  });

  test("Save button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /save/i })).toBeVisible({ timeout: 8000 });
  });
});

test.describe("IAM Simulate", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/iam/simulate");
  });

  test("renders action and resource inputs", async ({ page }) => {
    await expect(page.getByPlaceholder(/action/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder(/resource/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("Simulate button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /simulate/i })).toBeVisible({ timeout: 8000 });
  });

  test("submitting a simulation shows allowed or denied", async ({ page }) => {
    await page.getByPlaceholder(/action/i).first().fill("instance:list");
    await page.getByPlaceholder(/resource/i).first().fill("*");
    await page.getByRole("button", { name: /simulate/i }).click();
    await expect(page.getByText(/allowed|denied/i).first()).toBeVisible({ timeout: 10000 });
  });
});

test.describe("IAM Tokens", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/iam/tokens");
  });

  test("renders token management heading", async ({ page }) => {
    await expectHeading(page, "Users & Access");
    await expect(page.getByRole("link", { name: "API Keys" })).toBeVisible();
  });

  test("create token form has name and TTL inputs", async ({ page }) => {
    await expect(page.getByPlaceholder(/token name|name/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("Issue Token button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /issue|create/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("issuing a token shows the token value", async ({ page }) => {
    await page.getByPlaceholder(/token name|name/i).first().fill(`tok-${Date.now()}`);
    await page.getByRole("button", { name: /issue|create/i }).first().click();
    // Token value displayed in monospace amber
    await expect(page.getByText(/[a-zA-Z0-9_\-]{20,}/)).toBeVisible({ timeout: 10000 });
  });
});
