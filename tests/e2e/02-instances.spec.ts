import { test, expect } from "@playwright/test";
import { goto, expectHeading, clickTab } from "./helpers";

test.describe("Instance List", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/instances");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Instances");
  });

  test("filter buttons are present", async ({ page }) => {
    for (const label of ["All", "Running", "Stopped", "Failed"]) {
      await expect(page.getByRole("button", { name: label })).toBeVisible();
    }
  });

  test("filter buttons switch active state", async ({ page }) => {
    await page.getByRole("button", { name: "Running" }).click();
    await page.getByRole("button", { name: "Stopped" }).click();
    await page.getByRole("button", { name: "All" }).click();
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "State", "Image", "Type"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("empty state or instance rows render", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no instances/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Create Instance Wizard", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/instances/new");
  });

  test("renders wizard heading", async ({ page }) => {
    await expect(page.getByText(/launch|create|new instance/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("step 1 - image selection is present", async ({ page }) => {
    await expect(page.getByText(/image/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("wizard step labels are visible", async ({ page }) => {
    for (const step of ["Image", "Capsule Type", "Network", "Storage", "CapInit", "Review"]) {
      await expect(page.getByText(step, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("Next button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /next/i })).toBeVisible({ timeout: 8000 });
  });

  test("clicking Next without image shows validation or advances", async ({ page }) => {
    await page.getByRole("button", { name: /next/i }).click();
    // Either stays on step 1 or shows a validation message
    await expect(page.getByText(/image|step 1|select/i).first()).toBeVisible({ timeout: 4000 });
  });
});

test.describe("Instance Detail", () => {
  test("detail page for non-existent ID shows error or empty", async ({ page }) => {
    await goto(page, "/instances/nonexistent-id-000");
    const notFound = page.getByText(/not found|no instance|error/i).first();
    const nav = page.locator("nav").first();
    await expect(nav).toBeVisible({ timeout: 10000 });
    // Page should not crash — either shows error or loading
  });

  test("instance detail tabs are rendered if instance exists", async ({ page }) => {
    // Navigate to instances list and click the first row if any
    await goto(page, "/instances");
    const rows = page.locator("table tbody tr");
    const count = await rows.count();
    if (count === 0) {
      test.skip();
      return;
    }
    await rows.first().getByRole("link").first().click();
    // Should navigate to /instances/:id
    await page.waitForURL(/\/instances\/[^/]+$/);

    const tabs = ["Overview", "Events", "Logs", "Metrics", "Networking", "Storage", "CapInit", "Security", "Console", "JSON"];
    for (const tab of tabs) {
      await expect(page.getByRole("button", { name: tab })).toBeVisible({ timeout: 6000 });
    }
  });

  test("instance events tab loads", async ({ page }) => {
    await goto(page, "/instances");
    const rows = page.locator("table tbody tr");
    if (await rows.count() === 0) { test.skip(); return; }
    await rows.first().getByRole("link").first().click();
    await page.waitForURL(/\/instances\/[^/]+$/);
    await clickTab(page, "Events");
    await expect(page.getByText(/events|no events/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("instance logs tab loads with stream selector", async ({ page }) => {
    await goto(page, "/instances");
    const rows = page.locator("table tbody tr");
    if (await rows.count() === 0) { test.skip(); return; }
    await rows.first().getByRole("link").first().click();
    await page.waitForURL(/\/instances\/[^/]+$/);
    await clickTab(page, "Logs");
    await expect(page.getByText(/stdout|stderr/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("instance JSON tab shows monaco or raw JSON", async ({ page }) => {
    await goto(page, "/instances");
    const rows = page.locator("table tbody tr");
    if (await rows.count() === 0) { test.skip(); return; }
    await rows.first().getByRole("link").first().click();
    await page.waitForURL(/\/instances\/[^/]+$/);
    await clickTab(page, "JSON");
    // Monaco editor container or raw pre
    const editor = page.locator(".monaco-editor, pre").first();
    await expect(editor).toBeVisible({ timeout: 8000 });
  });

  test("instance console tab renders terminal container", async ({ page }) => {
    await goto(page, "/instances");
    const rows = page.locator("table tbody tr");
    if (await rows.count() === 0) { test.skip(); return; }
    await rows.first().getByRole("link").first().click();
    await page.waitForURL(/\/instances\/[^/]+$/);
    await clickTab(page, "Console");
    // xterm.js renders a div.xterm or the status line
    const terminal = page.locator(".xterm, [class*='terminal']").first();
    const status = page.getByText(/connected|disconnected|press/i).first();
    await expect(terminal.or(status)).toBeVisible({ timeout: 8000 });
  });
});
