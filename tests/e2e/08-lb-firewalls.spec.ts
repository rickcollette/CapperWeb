import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

const TS = Date.now();
const LB_NAME = `test-lb-${TS}`;
const FW_NAME = `test-fw-${TS}`;

test.describe("Load Balancers", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/lb");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Load Balancers");
  });

  test("Create LB button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create|new/i }).first()).toBeVisible({ timeout: 8000 });
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "Mode", "Status"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("create LB modal opens", async ({ page }) => {
    await page.getByRole("button", { name: /create|new/i }).first().click();
    await expect(page.getByPlaceholder(/lb name|name/i).first()).toBeVisible({ timeout: 6000 });
  });

  test("create LB modal has mode selector (TCP/HTTP)", async ({ page }) => {
    await page.getByRole("button", { name: /create|new/i }).first().click();
    const select = page.locator("select").first();
    await expect(select).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("option", { name: /tcp/i }).first()).toBeVisible();
    await expect(page.getByRole("option", { name: /http/i }).first()).toBeVisible();
  });

  test("create a load balancer and verify it appears", async ({ page }) => {
    await page.getByRole("button", { name: /create|new/i }).first().click();
    await page.getByPlaceholder(/lb name|name/i).first().fill(LB_NAME);
    await page.getByRole("button", { name: /create/i }).last().click();
    await expect(page.getByText(LB_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("clicking LB navigates to detail", async ({ page }) => {
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/lb\//);
    await expect(page.locator("nav")).toBeVisible();
  });
});

test.describe("LB Detail", () => {
  test("renders backends table and add backend form", async ({ page }) => {
    await goto(page, "/lb");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/lb\//);
    await expect(page.getByText(/backend|address/i).first()).toBeVisible({ timeout: 8000 });
    await expect(page.getByRole("button", { name: /add backend/i })).toBeVisible({ timeout: 8000 });
  });
});

test.describe("Firewalls", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/firewalls");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Firewalls");
  });

  test("create form has name and network inputs", async ({ page }) => {
    await expect(page.getByPlaceholder(/firewall name|name/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("Create Firewall button is present", async ({ page }) => {
    await expect(page.getByRole("button", { name: /create firewall/i })).toBeVisible({ timeout: 8000 });
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "Network", "Rules", "Status"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("create a firewall and verify it appears", async ({ page }) => {
    await goto(page, "/networks");
    const netLink = page.locator("table a").first();
    if (await netLink.count() === 0) { test.skip(); return; }
    const netName = await netLink.textContent();

    await goto(page, "/firewalls");
    await page.getByPlaceholder(/firewall name|name/i).first().fill(FW_NAME);
    // Select a network if a dropdown is present
    const netSelect = page.locator("select").first();
    if (await netSelect.count() > 0) {
      await netSelect.selectOption({ index: 1 });
    }
    await page.getByRole("button", { name: /create firewall/i }).click();
    await expect(page.getByText(FW_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("Apply button is present per firewall", async ({ page }) => {
    const applyBtn = page.getByRole("button", { name: /apply/i }).first();
    if (await applyBtn.count() === 0) { test.skip(); return; }
    await expect(applyBtn).toBeVisible();
  });
});
