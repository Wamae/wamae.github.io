import { defineConfig, devices } from "@playwright/test";

export const e2eOwnerName = "E2E Test Owner";
// Not 4321, the default of `astro dev`, so e2e runs do not clash with a dev server.
const port = 4399;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env["CI"]),
  reporter: process.env["CI"] ? "github" : "list",
  use: { baseURL: `http://127.0.0.1:${port}` },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Builds the real production site, then serves it locally.
  webServer: {
    command: `npm run build && npm run preview -- --host 127.0.0.1 --port ${port} --ignore-lock`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      PUBLIC_OWNER_NAME: e2eOwnerName,
      PUBLIC_OWNER_EMAIL: "e2e@example.invalid",
    },
  },
});
