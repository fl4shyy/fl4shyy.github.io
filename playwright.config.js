import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8765";
process.env.PLAYWRIGHT_BROWSERS_PATH = fileURLToPath(new URL("./tmp/ms-playwright", import.meta.url));

export default defineConfig({
  testDir: "./test/e2e",
  outputDir: "./tmp/playwright-results",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  retries: 0,
  use: {
    baseURL: BASE_URL,
    headless: true,
    viewport: { width: 420, height: 900 },
    actionTimeout: 5_000
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" }
    }
  ],
  webServer: {
    command: "node test/static-server.mjs",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 15_000
  }
});
