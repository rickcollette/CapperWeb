import { test } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT = path.resolve(__dirname, "../../screenshots");
fs.mkdirSync(OUT, { recursive: true });

async function shot(page: any, name: string) {
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage: true,
  });
}

// Wait for network idle, then wait for any "Loading…" text to disappear.
async function settle(page: any) {
  await page.waitForLoadState("networkidle").catch(() => {});
  // Give lazy-loaded chunks and API responses up to 3s to resolve.
  await page
    .waitForFunction(() => !document.body.innerText.includes("Loading…"), { timeout: 3000 })
    .catch(() => {});
  await page.waitForTimeout(300);
}

test.describe("Capper Web UI Screenshots", () => {
  test("01 - Dashboard / Home", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    await shot(page, "01-dashboard");
  });

  test("02 - Instances list", async ({ page }) => {
    await page.goto("/instances");
    await settle(page);
    await shot(page, "02-instances");
  });

  test("03 - Networks list", async ({ page }) => {
    await page.goto("/networks");
    await settle(page);
    await shot(page, "03-networks");
  });

  test("04 - VPCs list", async ({ page }) => {
    await page.goto("/vpcs");
    await settle(page);
    await shot(page, "04-vpcs");
  });

  test("05 - Storage / Buckets", async ({ page }) => {
    await page.goto("/storage");
    await settle(page);
    await shot(page, "05-storage");
  });

  test("06 - Images / Registry", async ({ page }) => {
    await page.goto("/images");
    await settle(page);
    await shot(page, "06-images");
  });

  test("07 - DNS", async ({ page }) => {
    await page.goto("/dns");
    await settle(page);
    await shot(page, "07-dns");
  });

  test("08 - Load Balancers", async ({ page }) => {
    await page.goto("/lb");
    await settle(page);
    await shot(page, "08-load-balancers");
  });

  test("09 - Ingress / Static Sites", async ({ page }) => {
    await page.goto("/ingress");
    await settle(page);
    await shot(page, "09-ingress");
  });

  test("10 - Firewalls", async ({ page }) => {
    await page.goto("/firewalls");
    await settle(page);
    await shot(page, "10-firewall");
  });

  test("11 - IAM Users", async ({ page }) => {
    await page.goto("/iam/users");
    await settle(page);
    await shot(page, "11-iam");
  });

  test("12 - Secrets / KMS", async ({ page }) => {
    await page.goto("/kms");
    await settle(page);
    await shot(page, "12-secrets");
  });

  test("13 - Topology / Nodes", async ({ page }) => {
    await page.goto("/topology");
    await settle(page);
    await shot(page, "13-topology");
  });

  test("14 - Compute Groups", async ({ page }) => {
    await page.goto("/groups");
    await settle(page);
    await shot(page, "14-compute-groups");
  });

  test("15 - Databases", async ({ page }) => {
    await page.goto("/databases");
    await settle(page);
    await shot(page, "15-databases");
  });

  test("16 - Backups", async ({ page }) => {
    await page.goto("/backups");
    await settle(page);
    await shot(page, "16-backups");
  });

  test("17 - Stacks / Bottles", async ({ page }) => {
    await page.goto("/stacks");
    await settle(page);
    await shot(page, "17-stacks");
  });

  test("18 - Marketplace", async ({ page }) => {
    await page.goto("/marketplace");
    await settle(page);
    await shot(page, "18-marketplace");
  });

  test("19 - Quotas", async ({ page }) => {
    await page.goto("/quotas");
    await settle(page);
    await shot(page, "19-quotas");
  });

  test("20 - Posture / Security", async ({ page }) => {
    await page.goto("/posture");
    await settle(page);
    await shot(page, "20-posture");
  });

  test("21 - AI Control Plane", async ({ page }) => {
    await page.goto("/ai");
    await settle(page);
    await shot(page, "21-ai");
  });

  test("22 - Search", async ({ page }) => {
    await page.goto("/search");
    await settle(page);
    await shot(page, "22-search");
  });

  test("23 - Settings", async ({ page }) => {
    await page.goto("/settings");
    await settle(page);
    await shot(page, "23-settings");
  });

  // ---- Navigation and modal screenshots ----

  test("24 - Sidebar navigation all sections expanded", async ({ page }) => {
    await page.goto("/");
    await settle(page);
    // Expand every collapsed section by clicking all nav section-header buttons.
    const headers = page.locator("nav > div > button");
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      await headers.nth(i).click().catch(() => {});
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(300);
    await shot(page, "24-sidebar-nav");
  });

  test("25 - Launch instance modal", async ({ page }) => {
    await page.goto("/instances");
    await settle(page);
    const btn = page.locator("button").filter({ hasText: /launch|create|new instance/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(500);
    }
    await shot(page, "25-launch-instance-modal");
  });

  test("26 - Create VPC modal", async ({ page }) => {
    await page.goto("/vpcs");
    await settle(page);
    const btn = page.locator("button").filter({ hasText: /create vpc/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(500);
    }
    await shot(page, "26-create-vpc-modal");
  });

  test("27 - Create bucket modal", async ({ page }) => {
    await page.goto("/storage");
    await settle(page);
    const btn = page.locator("button").filter({ hasText: /create|new bucket/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(500);
    }
    await shot(page, "27-create-bucket-modal");
  });

  test("28 - Create load balancer modal", async ({ page }) => {
    await page.goto("/lb");
    await settle(page);
    const btn = page.locator("button").filter({ hasText: /create|new lb|new load/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(500);
    }
    await shot(page, "28-create-lb-modal");
  });

  test("29 - Backup policy modal", async ({ page }) => {
    await page.goto("/backups");
    await settle(page);
    const btn = page.locator("button").filter({ hasText: /create|add policy|new backup/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(500);
    }
    await shot(page, "29-backup-policy-modal");
  });

  test("30 - IAM policy simulator", async ({ page }) => {
    await page.goto("/iam/simulate");
    await settle(page);
    await shot(page, "30-iam-policy-sim");
  });
});
