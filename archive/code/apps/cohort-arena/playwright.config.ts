import { defineConfig } from "@playwright/test";

const hostname = "127.0.0.1";
const port = 4173;
const baseURL = `http://${hostname}:${port}`;

export default defineConfig({
  testDir: "./test",
  testMatch: "runtime.smoke.spec.ts",
  outputDir: ".next/playwright-results",
  fullyParallel: false,
  workers: 1,
  reporter: "line",
  use: {
    baseURL,
    browserName: "chromium",
    headless: true,
    trace: "retain-on-failure",
    viewport: { width: 1440, height: 1000 },
    launchOptions: {
      args: ["--enable-webgl", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"],
    },
  },
  webServer: {
    command: `pnpm start --hostname ${hostname} --port ${port}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    stdout: "pipe",
    stderr: "pipe",
  },
});
