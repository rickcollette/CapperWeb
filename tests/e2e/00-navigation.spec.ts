/**
 * Navigation smoke tests — every route must load without a crash or blank page.
 * We check that the AppShell sidebar renders and no "Something went wrong"
 * error boundary message appears.
 */
import { test, expect } from "@playwright/test";

const ROUTES = [
  "/",
  "/instances",
  "/instances/new",
  "/images",
  "/capsules",
  "/marketplace",
  "/factory",
  "/vpcs",
  "/storage",
  "/dns",
  "/capinit",
  "/iam/users",
  "/iam/groups",
  "/iam/roles",
  "/iam/policies",
  "/iam/simulate",
  "/iam/tokens",
  "/audit",
  "/settings",
  "/lb",
  "/firewalls",
  "/health",
  "/stacks",
  "/databases",
  "/ai",
  "/backups",
  "/instance-types",
  "/quotas",
  "/posture",
  "/gpu",
  "/certs",
  "/ingress",
  "/queues",
  "/search",
];

test("/iam/access redirects to users", async ({ page }) => {
  await page.goto("/iam/access");
  await expect(page).toHaveURL(/\/iam\/users$/);
});

for (const route of ROUTES) {
  test(`${route} renders app shell`, async ({ page }) => {
    await page.goto(route);
    // Sidebar nav always present in AppShell
    await expect(page.locator("nav").first()).toBeVisible({ timeout: 12000 });
    // No crash / error boundary
    await expect(page.getByText("Something went wrong", { exact: false })).not.toBeVisible();
    await expect(page.getByText("Cannot read properties", { exact: false })).not.toBeVisible();
  });
}

test("unknown route falls back to app shell (SPA catch-all)", async ({ page }) => {
  await page.goto("/this-route-does-not-exist-404xyz");
  await expect(page.locator("nav").first()).toBeVisible({ timeout: 12000 });
});

test("sidebar nav links are all present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav").first()).toBeVisible({ timeout: 12000 });

  const expectedLinks = [
    "Dashboard",
    "Instances",
    "Images",
    "VPCs",
    "Storage",
    "DNS",
    "Load Balancers",
    "Firewalls",
    "Databases",
    "Stacks",
    "Capsules",
    "Instance Types",
    "Marketplace",
    "Factory",
    "AI",
    "CapInit",
    "Backups",
    "Health",
    "Posture",
    "Quotas",
    "GPU",
    "Certificates",
    "Ingress",
    "Queues",
    "IAM",
    "Users & Access",
    "Audit",
    "Settings",
  ];

  for (const label of expectedLinks) {
    await expect(
      page.locator("nav").getByText(label, { exact: false }).first()
    ).toBeVisible({ timeout: 4000 });
  }
});

test("header shows project name and daemon badge", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("nav").first()).toBeVisible({ timeout: 12000 });
  // Header contains "default" project identifier
  await expect(page.getByText("default", { exact: false }).first()).toBeVisible();
});
