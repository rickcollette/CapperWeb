import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  retries: 1,
  workers: 1,
  reporter: [["list"], ["html", { outputFolder: "tests/report", open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:8687",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 8000,
    navigationTimeout: 15000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
