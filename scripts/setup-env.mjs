/**
 * Creates `.env` by asking for the owner name and email, so the site can run locally.
 * Usage: `npm run setup:env`. It never overwrites an existing `.env` unless run with `--force`.
 */
import { existsSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { renderEnvFile } from "./env-file.mjs";

const envPath = new URL("../.env", import.meta.url);
const force = process.argv.includes("--force");

if (existsSync(envPath) && !force) {
  console.log(".env already exists, so it was left as it is. Run with --force to replace it.");
  process.exit(0);
}

if (!process.stdin.isTTY) {
  console.error("This needs a terminal to ask for the values. Copy .env.example to .env instead.");
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
try {
  const name = await rl.question("Your name (shown on the site): ");
  const email = await rl.question("Your email (shown on the site, so it is public): ");
  writeFileSync(envPath, renderEnvFile({ name, email }));
  console.log("Created .env (gitignored). Start the site with: npm run local");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  rl.close();
}
