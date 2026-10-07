import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts", "scripts/**/*.test.mjs", "tests/integration/**/*.test.ts"],
    // Integration tests run a real `astro build`.
    testTimeout: 120_000,
    // Every integration file runs `astro build`, and parallel builds collide on the shared
    // `.astro/.prerender` folder, so files run one after another.
    fileParallelism: false,
  },
});
