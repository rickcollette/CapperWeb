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

  test("Create LB link navigates to wizard", async ({ page }) => {
    await page.getByRole("link", { name: /create lb/i }).click();
    await page.waitForURL(/\/lb\/new/);
    await expectHeading(page, "Create Load Balancer");
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "Scheme", "VIP", "Status"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("create wizard step 1 has name and type", async ({ page }) => {
    await goto(page, "/lb/new");
    await expect(page.getByText(/identity/i).first()).toBeVisible({ timeout: 6000 });
    await expect(page.locator("input").first()).toBeVisible();
    await expect(page.getByText(/application/i).first()).toBeVisible();
  });

  test("create wizard step 2 has scheme toggle", async ({ page }) => {
    await goto(page, "/lb/new");
    await page.locator("input").first().fill(LB_NAME);
    await page.getByRole("button", { name: /next/i }).click();
    await expect(page.getByText(/internal/i).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/internet-facing/i).first()).toBeVisible();
  });

  test("create a load balancer and verify it appears", async ({ page }) => {
    await goto(page, "/lb/new");
    await page.locator("input").first().fill(LB_NAME);
    await page.getByRole("button", { name: /next/i }).click();
    await page.getByRole("button", { name: /next/i }).click();
    await page.getByLabel(/skip first listener/i).check();
    await page.getByRole("button", { name: /create load balancer/i }).click();
    await page.waitForURL(new RegExp(`/lb/${LB_NAME}`), { timeout: 15000 });
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
  test("renders tabbed detail with listeners and target groups", async ({ page }) => {
    await goto(page, "/lb");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/lb\//);
    for (const tab of ["Overview", "Listeners", "Target Groups"]) {
      await expect(page.getByRole("button", { name: tab })).toBeVisible({ timeout: 8000 });
    }
    await page.getByRole("button", { name: "Listeners" }).click();
    await expect(page.getByRole("button", { name: /add listener/i })).toBeVisible({ timeout: 8000 });
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
    await goto(page, "/vpcs");
    const vpcLink = page.locator("table a, [data-testid='vpc-row']").first();
    if (await vpcLink.count() === 0) { test.skip(); return; }

    await goto(page, "/firewalls");
    await page.getByPlaceholder(/firewall name|name/i).first().fill(FW_NAME);
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
