import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import astro from "eslint-plugin-astro";
import tseslint from "typescript-eslint";

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
  astro.configs.recommended,
);
