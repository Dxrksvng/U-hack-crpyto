import { defineConfig, devices } from "@playwright/test";

// Uses the locally installed Google Chrome (channel "chrome") so no browser download is needed.
export default defineConfig({
  testDir: "tests/e2e",
  timeout: 45_000,
  expect: { timeout: 8_000 },
  fullyParallel: true,
  workers: 4,
  reporter: [["list"]],
  use: { baseURL: "http://localhost:5173", channel: "chrome", trace: "retain-on-failure", locale: "en-US" },
  projects: [
    { name: "mobile", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 390, height: 844 }, hasTouch: true } },
    { name: "desktop", use: { ...devices["Desktop Chrome"], channel: "chrome", viewport: { width: 1440, height: 900 } }, testMatch: /(a11y|layout)\.spec\.ts/ },
  ],
  webServer: { command: "npx vite --port 5173 --strictPort", url: "http://localhost:5173", reuseExistingServer: true, timeout: 60_000 },
});
