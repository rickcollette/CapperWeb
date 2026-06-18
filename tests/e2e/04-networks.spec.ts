import { test, expect } from "@playwright/test";
import { goto, expectHeading, fillInput, clickButton } from "./helpers";

const TS = Date.now();
const NET_NAME = `test-net-${TS}`;

test.describe("Networks", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/networks");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "Networks");
  });

  test("create form has name input and button", async ({ page }) => {
    await expect(page.getByPlaceholder(/name/i).first()).toBeVisible({ timeout: 6000 });
    await expect(page.getByRole("button", { name: /create/i }).first()).toBeVisible();
  });

  test("table headers present", async ({ page }) => {
    for (const col of ["Name", "CIDR", "Gateway", "Mode", "Status"]) {
      await expect(page.getByText(col, { exact: false }).first()).toBeVisible({ timeout: 8000 });
    }
  });

  test("create a network and verify it appears in list", async ({ page }) => {
    await page.getByPlaceholder(/name/i).first().fill(NET_NAME);
    await page.getByRole("button", { name: /create/i }).first().click();
    await expect(page.getByText(NET_NAME, { exact: false })).toBeVisible({ timeout: 10000 });
  });

  test("clicking a network name navigates to detail", async ({ page }) => {
    const link = page.locator("table a").first();
    const count = await link.count();
    if (count === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/networks\//);
    await expect(page.locator("nav")).toBeVisible();
  });
});

test.describe("Network Detail", () => {
  test("renders network info and DHCP section", async ({ page }) => {
    await goto(page, "/networks");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/networks\//);
    await expect(page.getByText(/bridge|gateway|mode|leases/i).first()).toBeVisible({ timeout: 8000 });
  });

  test("renders attached instances section", async ({ page }) => {
    await goto(page, "/networks");
    const link = page.locator("table a").first();
    if (await link.count() === 0) { test.skip(); return; }
    await link.click();
    await page.waitForURL(/\/networks\//);
    await expect(page.getByText(/attached|instances/i).first()).toBeVisible({ timeout: 8000 });
  });
});
