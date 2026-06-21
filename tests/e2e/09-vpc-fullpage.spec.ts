import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

test.describe("VPC full-page UX", () => {
  test("VPC list links to create wizard", async ({ page }) => {
    await goto(page, "/vpcs");
    const create = page.getByRole("link", { name: /create vpc/i }).first();
    await expect(create).toHaveAttribute("href", "/vpcs/new");
  });

  test("Create VPC wizard shows three steps", async ({ page }) => {
    await goto(page, "/vpcs/new");
    await expectHeading(page, "Create VPC");
    await expect(page.getByText(/1\. identity/i)).toBeVisible({ timeout: 6000 });
    await expect(page.getByText(/2\. initial subnets/i)).toBeVisible();
    await expect(page.getByText(/3\. connectivity/i)).toBeVisible();
  });

  test("VPC detail has management tabs", async ({ page }) => {
    await goto(page, "/vpcs");
    const link = page.locator("table tbody tr a").first();
    if ((await link.count()) === 0) {
      test.skip();
      return;
    }
    await link.click();
    await page.waitForSelector("nav");
    await expect(page.getByRole("button", { name: "Subnets" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Security Groups" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Gateways" })).toBeVisible();
  });

  test("Mobility plan create is full page", async ({ page }) => {
    await goto(page, "/vpcs");
    const link = page.locator("table tbody tr a").first();
    if ((await link.count()) === 0) {
      test.skip();
      return;
    }
    const href = await link.getAttribute("href");
    await goto(page, `${href}/mobility/plans/new`);
    await expectHeading(page, "Create Mobility Plan");
  });
});
