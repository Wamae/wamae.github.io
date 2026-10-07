import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const run = promisify(execFile);
const astroBin = join(process.cwd(), "node_modules", "astro", "bin", "astro.mjs");

let outDir = "";

beforeEach(async () => {
  outDir = await mkdtemp(join(tmpdir(), "site-build-"));
});

afterEach(async () => {
  await rm(outDir, { recursive: true, force: true });
});

// Explicit values (even empty ones) take priority over any local .env file.
function buildWith(env: Record<string, string>) {
  return run(process.execPath, [astroBin, "build", "--outDir", outDir], {
    env: { ...process.env, ...env },
  });
}

describe("production build", () => {
  it("renders the configured owner name into the home page", async () => {
    await buildWith({
      PUBLIC_OWNER_NAME: "Integration Owner",
      PUBLIC_OWNER_EMAIL: "integration@example.invalid",
    });

    const html = await readFile(join(outDir, "index.html"), "utf8");
    expect(html).toContain("<title>Integration Owner</title>");
    expect(html).toContain("<h1>Integration Owner</h1>");
    expect(html).toMatch(/<html lang="en"/);
  });

  it("fails when the owner name or email is empty", async () => {
    await expect(
      buildWith({ PUBLIC_OWNER_NAME: "", PUBLIC_OWNER_EMAIL: "" }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("PUBLIC_OWNER_NAME is missing or empty"),
    });
  });

  it("fails with a clear message when the owner email is missing or empty", async () => {
    await expect(
      buildWith({ PUBLIC_OWNER_NAME: "Integration Owner", PUBLIC_OWNER_EMAIL: "" }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("PUBLIC_OWNER_EMAIL is missing or empty"),
    });
  });

  it("fails when the owner email is malformed", async () => {
    await expect(
      buildWith({ PUBLIC_OWNER_NAME: "Integration Owner", PUBLIC_OWNER_EMAIL: "not-an-email" }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("PUBLIC_OWNER_EMAIL is not a valid email address"),
    });
  });

  it("fails when the values are the .env.example placeholders", async () => {
    await expect(
      buildWith({ PUBLIC_OWNER_NAME: "Your Name", PUBLIC_OWNER_EMAIL: "you@example.com" }),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("is still the placeholder from .env.example"),
    });
  });
});
