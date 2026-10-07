import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

// .astro files are linted by the Astro plugin, added in a later commit.
export default defineConfig(
  globalIgnores([
    "dist/**",
    ".astro/**",
    "node_modules/**",
    "playwright-report/**",
    "test-results/**",
  ]),
  js.configs.recommended,
  tseslint.configs.strict,
);
