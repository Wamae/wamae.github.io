import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/integration/**/*.test.ts"],
    // Integration tests run a real `astro build`.
    testTimeout: 120_000,
  },
});
