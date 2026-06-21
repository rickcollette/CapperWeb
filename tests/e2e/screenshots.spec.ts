import { test } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { goto } from "./helpers";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT = path.resolve(__dirname, "../../../Capper/docs/assets/images/screenshots");

fs.mkdirSync(OUT, { recursive: true });

async function shot(page: import("@playwright/test").Page, name: string) {
  await page.screenshot({
    path: path.join(OUT, `${name}.png`),
    fullPage: true,
  });
}

async function settle(page: import("@playwright/test").Page) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page
    .waitForFunction(() => !document.body.innerText.includes("Loading…"), { timeout: 8000 })
    .catch(() => {});
  await page.waitForTimeout(400);
}

test.describe.configure({ mode: "serial" });

test.describe("Capper Web UI Screenshots", () => {
  test("01 - Dashboard / Home", async ({ page }) => {
    await goto(page, "/");
    await settle(page);
    await shot(page, "01-dashboard");
  });

  test("02 - Instances list", async ({ page }) => {
    await goto(page, "/instances");
    await settle(page);
    await shot(page, "02-instances");
  });

  test("03 - VPCs list", async ({ page }) => {
    await goto(page, "/vpcs");
    await settle(page);
    await shot(page, "03-vpcs");
  });

  test("04 - Networking dashboard", async ({ page }) => {
    await goto(page, "/networking");
    await settle(page);
    await shot(page, "32-networking-dashboard");
  });

  test("05 - Storage / Buckets", async ({ page }) => {
    await goto(page, "/storage");
    await settle(page);
    await shot(page, "05-storage");
  });

  test("06 - Images / Registry", async ({ page }) => {
    await goto(page, "/images");
    await settle(page);
    await shot(page, "06-images");
  });

  test("07 - DNS", async ({ page }) => {
    await goto(page, "/dns");
    await settle(page);
    await shot(page, "07-dns");
  });

  test("08 - Load Balancers", async ({ page }) => {
    await goto(page, "/lb");
    await settle(page);
    await shot(page, "08-load-balancers");
  });

  test("09 - Ingress / Static Sites", async ({ page }) => {
    await goto(page, "/ingress");
    await settle(page);
    await shot(page, "09-ingress");
  });

  test("10 - Firewalls", async ({ page }) => {
    await goto(page, "/firewalls");
    await settle(page);
    await shot(page, "10-firewall");
  });

  test("11 - IAM Users", async ({ page }) => {
    await goto(page, "/iam/users");
    await settle(page);
    await shot(page, "11-iam");
  });

  test("12 - Secrets / KMS", async ({ page }) => {
    await goto(page, "/kms");
    await settle(page);
    await shot(page, "12-secrets");
  });

  test("13 - Topology / Nodes", async ({ page }) => {
    await goto(page, "/topology");
    await settle(page);
    await shot(page, "13-topology");
  });

  test("14 - Compute Groups", async ({ page }) => {
    await goto(page, "/groups");
    await settle(page);
    await shot(page, "14-compute-groups");
  });

  test("15 - Databases", async ({ page }) => {
    await goto(page, "/databases");
    await settle(page);
    await shot(page, "15-databases");
  });

  test("16 - Backups", async ({ page }) => {
    await goto(page, "/backups");
    await settle(page);
    await shot(page, "16-backups");
  });

  test("17 - Stacks / Bottles", async ({ page }) => {
    await goto(page, "/stacks");
    await settle(page);
    await shot(page, "17-stacks");
  });

  test("18 - Marketplace", async ({ page }) => {
    await goto(page, "/marketplace");
    await settle(page);
    await shot(page, "18-marketplace");
  });

  test("19 - Quotas", async ({ page }) => {
    await goto(page, "/quotas");
    await settle(page);
    await shot(page, "19-quotas");
  });

  test("20 - Posture / Security", async ({ page }) => {
    await goto(page, "/posture");
    await settle(page);
    await shot(page, "20-posture");
  });

  test("21 - AI Control Plane", async ({ page }) => {
    await goto(page, "/ai");
    await settle(page);
    await shot(page, "21-ai");
  });

  test("22 - Search", async ({ page }) => {
    await goto(page, "/search");
    await settle(page);
    await shot(page, "22-search");
  });

  test("23 - Settings", async ({ page }) => {
    await goto(page, "/settings");
    await settle(page);
    await shot(page, "23-settings");
  });

  test("24 - Sidebar navigation all sections expanded", async ({ page }) => {
    await goto(page, "/");
    await settle(page);
    const headers = page.locator("nav > div > button");
    const count = await headers.count();
    for (let i = 0; i < count; i++) {
      await headers.nth(i).click().catch(() => {});
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(300);
    await shot(page, "24-sidebar-nav");
  });

  test("25 - Launch instance wizard", async ({ page }) => {
    await goto(page, "/instances/new");
    await settle(page);
    await shot(page, "25-launch-instance-modal");
  });

  test("26 - Create VPC wizard", async ({ page }) => {
    await goto(page, "/vpcs/new");
    await settle(page);
    await shot(page, "26-create-vpc-wizard");
  });

  test("34 - VPC detail", async ({ page }) => {
    await goto(page, "/vpcs");
    await settle(page);
    const link = page.locator("table tbody tr a").first();
    if (await link.count()) {
      await link.click();
      await settle(page);
    }
    await shot(page, "34-vpc-detail");
  });

  test("27 - Create bucket modal", async ({ page }) => {
    await goto(page, "/storage");
    await settle(page);
    await shot(page, "27-create-bucket-modal");
  });

  test("28 - Create load balancer wizard", async ({ page }) => {
    await goto(page, "/lb/new");
    await settle(page);
    await shot(page, "28-create-lb-modal");
  });

  test("29 - Backup policy modal", async ({ page }) => {
    await goto(page, "/backups");
    await settle(page);
    const btn = page.getByRole("button", { name: /create|add policy|new backup/i }).first();
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(500);
    }
    await shot(page, "29-backup-policy-modal");
  });

  test("30 - IAM policy simulator", async ({ page }) => {
    await goto(page, "/iam/simulate");
    await settle(page);
    await shot(page, "30-iam-policy-sim");
  });

  test("31 - Admin host storage pools", async ({ page }) => {
    await goto(page, "/admin/storage");
    await settle(page);
    await shot(page, "31-admin-storage");
  });

  test("33 - Launch instance networking step", async ({ page }) => {
    await goto(page, "/instances/new");
    await settle(page);
    for (let i = 0; i < 4; i++) {
      const next = page.getByRole("button", { name: /^next$/i });
      if (await next.count()) await next.click();
      await page.waitForTimeout(250);
    }
    await settle(page);
    await shot(page, "33-launch-instance-networking");
  });
});
