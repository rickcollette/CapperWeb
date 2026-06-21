import { test, expect } from "@playwright/test";
import { goto, expectHeading } from "./helpers";

test.describe("VPCs", () => {
  test.beforeEach(async ({ page }) => {
    await goto(page, "/vpcs");
  });

  test("renders page heading", async ({ page }) => {
    await expectHeading(page, "VPCs");
  });

  test("create vpc link navigates to wizard", async ({ page }) => {
    const link = page.getByRole("link", { name: /create vpc/i }).first();
    await expect(link).toBeVisible({ timeout: 8000 });
    await expect(link).toHaveAttribute("href", "/vpcs/new");
  });
});
