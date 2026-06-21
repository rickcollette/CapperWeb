import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "tests/report", open: "never" }]],
  use: {
    baseURL: process.env.CAPPER_WEB_URL ?? "http://127.0.0.1:8687",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 8000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: "screenshots-setup",
      testMatch: /screenshots\.auth\.setup\.ts/,
    },
    {
      name: "screenshots",
      testMatch: /screenshots\.spec\.ts/,
      dependencies: ["screenshots-setup"],
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/e2e/.auth/screenshots.json",
      },
    },
    {
      name: "chromium",
      testIgnore: [/screenshots\.spec\.ts/, /screenshots\.auth\.setup\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
