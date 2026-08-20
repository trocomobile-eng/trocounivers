import { defineConfig } from "@playwright/test";
import path from "path";

const PORT = 5174;
const BASE_URL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["list"],
  ],

  use: {
    baseURL: BASE_URL,
    // macOS 10.15 : utilise Chrome système (les builds Playwright ne supportent pas Catalina)
    channel: "chrome",
    headless: false,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "on-first-retry",
    locale: "fr-FR",
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro — rendu mobile par défaut
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      // Chrome avec viewport mobile (macOS 10.15 ne supporte pas Chromium headless de Playwright)
      name: "mobile",
      use: {
        channel: "chrome",
        headless: false,
        viewport: { width: 390, height: 844 },
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 Chrome/120.0.0.0",
      },
    },
    {
      name: "desktop",
      use: {
        channel: "chrome",
        headless: false,
        viewport: { width: 1280, height: 800 },
      },
    },
  ],

  // Démarre le serveur Vite en mode test (pointe vers les émulateurs Firebase)
  webServer: {
    command: "npm run dev:test",
    port: PORT,
    reuseExistingServer: true,
    timeout: 30_000,
  },

  globalSetup: path.resolve(__dirname, "e2e/global-setup.ts"),
  globalTeardown: path.resolve(__dirname, "e2e/global-teardown.ts"),

  outputDir: "playwright-results",
});
