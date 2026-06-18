import { Page, expect } from "@playwright/test";

/** Navigate to a route and wait for the app shell to be ready. */
export async function goto(page: Page, path: string) {
  await page.goto(path);
  // AppShell sidebar is always present
  await page.waitForSelector("nav", { timeout: 10000 });
}

/** Assert no uncaught JS errors on the page (call after navigation). */
export async function expectNoConsoleErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  return errors;
}

/** Fill a visible input that has a placeholder or label. */
export async function fillInput(page: Page, placeholder: string, value: string) {
  await page.getByPlaceholder(placeholder).fill(value);
}

/** Click a button by its visible text. */
export async function clickButton(page: Page, label: string) {
  await page.getByRole("button", { name: label }).click();
}

/** Wait for a toast / status message containing text. */
export async function expectText(page: Page, text: string) {
  await expect(page.getByText(text, { exact: false })).toBeVisible({ timeout: 8000 });
}

/** Assert a table row with the given text exists. */
export async function expectTableRow(page: Page, text: string) {
  await expect(page.locator("table").getByText(text, { exact: false })).toBeVisible({ timeout: 8000 });
}

/** Click a nav link by its accessible name. */
export async function navTo(page: Page, name: string) {
  await page.getByRole("link", { name }).first().click();
  await page.waitForSelector("nav");
}

/** Assert page header title is visible. */
export async function expectHeading(page: Page, text: string) {
  await expect(page.getByRole("heading", { name: text, exact: false })).toBeVisible({ timeout: 8000 });
}

/** Click a tab button by label. */
export async function clickTab(page: Page, label: string) {
  await page.getByRole("button", { name: label, exact: true }).click();
}
