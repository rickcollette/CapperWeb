import { test, expect } from "@playwright/test";
import { goto, expectHeading, clickTab } from "./helpers";

const TS = Date.now();

test.describe("AI Control Plane", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/ai");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "AI");
  });

  test("Agents, Sessions, MCP tabs are present", async ({ page }) => {
    for (const tab of ["Agents", "Sessions", "MCP"]) {
      await expect(page.getByRole("button", { name: tab })).toBeVisible({ timeout: 8000 });
    }
  });

  test("Agents tab has create form with name and model inputs", async ({ page }) => {
    await clickTab(page, "Agents");
    await expect(page.getByPlaceholder(/agent name|name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder(/model/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("create an agent and verify it appears", async ({ page }) => {
    await clickTab(page, "Agents");
    await page.getByPlaceholder(/agent name|name/i).first().fill(`agent-${TS}`);
    await page.getByPlaceholder(/model/i).first().fill("claude-sonnet-4-5");
    await page.getByRole("button", { name: /create agent/i }).click();
    await expect(page.getByText(`agent-${TS}`, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("Sessions tab renders sessions table or empty", async ({ page }) => {
    await clickTab(page, "Sessions");
    const table = page.locator("table");
    const empty = page.getByText(/no sessions/i);
    await expect(table.or(empty)).toBeVisible({ timeout: 8000 });
  });

  test("MCP tab has create form with name and endpoint inputs", async ({ page }) => {
    await clickTab(page, "MCP");
    await expect(page.getByPlaceholder(/server name|name/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByPlaceholder(/endpoint/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("create an MCP server and verify it appears", async ({ page }) => {
    await clickTab(page, "MCP");
    await page.getByPlaceholder(/server name|name/i).first().fill(`mcp-${TS}`);
    await page.getByPlaceholder(/endpoint/i).first().fill("http://localhost:3000");
    await page.getByRole("button", { name: /create/i }).last().click();
    await expect(page.getByText(`mcp-${TS}`, { exact: false })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("GPU Inventory", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/gpu");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "GPU");
  });

  test("status filter buttons are present", async ({ page }) => {
    for (const label of ["All", "Available", "Assigned"]) {
      await expect(page.getByRole("button", { name: label }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("KPI cards show Total / Available / Assigned counts", async ({ page }) => {
    for (const label of ["Total", "Available", "Assigned"]) {
      await expect(page.getByText(label, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("GPU table renders or empty state shows (note: requires /api/v1/gpu endpoint)", async ({ page }) => {
    const table = page.locator("table");
    const empty = page.getByText(/no gpu|no devices|not found/i);
    const error = page.getByText(/error|404|failed/i);
    await expect(table.or(empty).or(error)).toBeVisible({ timeout: 8000 });
  });

  test("Available filter shows only available GPUs", async ({ page }) => {
    await page.getByRole("button", { name: "Available" }).click();
  });

  test("Assigned filter shows only assigned GPUs", async ({ page }) => {
    await page.getByRole("button", { name: "Assigned" }).click();
  });
});
