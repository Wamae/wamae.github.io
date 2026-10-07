import { defineConfig } from "astro/config";

// Output is fully static so the site can be served from GitHub Pages.
export default defineConfig({
  site: "https://wamae.github.io",
  output: "static",
});
