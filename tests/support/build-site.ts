import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const astroBin = join(process.cwd(), "node_modules", "astro", "bin", "astro.mjs");

export interface BuiltSite {
  readonly outDir: string;
  readonly html: string;
  readFileText(relativePath: string): Promise<string>;
  listFiles(relativeDir: string): Promise<string[]>;
  remove(): Promise<void>;
}

/** Runs a real production build into a temporary folder and returns the home page HTML. */
export async function buildSite(env: Record<string, string>): Promise<BuiltSite> {
  const outDir = await mkdtemp(join(tmpdir(), "site-build-"));
  await run(process.execPath, [astroBin, "build", "--outDir", outDir], {
    env: { ...process.env, ...env },
  });
  return {
    outDir,
    html: await readFile(join(outDir, "index.html"), "utf8"),
    readFileText: (relativePath) => readFile(join(outDir, relativePath), "utf8"),
    listFiles: (relativeDir) => readdir(join(outDir, relativeDir)),
    remove: () => rm(outDir, { recursive: true, force: true }),
  };
}
