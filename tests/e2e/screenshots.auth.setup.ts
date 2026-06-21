import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUTH = path.resolve(__dirname, ".auth/screenshots.json");
const USER = process.env.DOCS_SCREENSHOT_USER ?? "docs";
const PASS = process.env.DOCS_SCREENSHOT_PASS ?? "docs-demo";

fs.mkdirSync(path.dirname(AUTH), { recursive: true });

setup("authenticate for docs screenshots", async ({ page }) => {
  await page.goto("/");
  await page.getByPlaceholder("Username or email").fill(USER);
  await page.getByPlaceholder("Password").fill(PASS);
  await page.getByRole("button", { name: /sign in/i }).click();

  const forced = page.getByRole("heading", { name: "Set a new password" });
  if (await forced.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.getByPlaceholder("Current password").fill(PASS);
    await page.getByPlaceholder("New password").fill(PASS);
    await page.getByPlaceholder("Confirm new password").fill(PASS);
    await page.getByRole("button", { name: /update password/i }).click();
  }

  await expect(page.locator("nav").first()).toBeVisible({ timeout: 15000 });
  await page.context().storageState({ path: AUTH });
});
