import js from "@eslint/js";
import tseslint from "typescript-eslint";

// .astro files are not linted here: no Astro lint plugin passes the dependency policy.
// They are covered by `astro check`.
export default tseslint.config(
  {
    ignores: ["dist/**", ".astro/**", "node_modules/**", "playwright-report/**", "test-results/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
);
