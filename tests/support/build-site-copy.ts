import { execFile } from "node:child_process";
import { cp, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);
const projectRoot = process.cwd();
const copied = ["src", "public", "content", "astro.config.mjs", "package.json", "tsconfig.json"];

export interface CopyBuild {
  readonly ok: boolean;
  /** What the build printed on failure. Empty when it passed. */
  readonly stderr: string;
  readFileText(relativePath: string): Promise<string>;
  remove(): Promise<void>;
}

/**
 * Copies the site to a temporary folder, lets `editCv` change content/cv.yml there, and runs a
 * real production build in the copy. The real repository is never touched. Used to prove that the
 * site is made from content/cv.yml alone.
 */
export async function buildSiteWithEditedCv(
  env: Record<string, string>,
  editCv: (cvText: string) => string,
): Promise<CopyBuild> {
  const root = await mkdtemp(join(tmpdir(), "site-copy-"));
  for (const name of copied)
    await cp(join(projectRoot, name), join(root, name), { recursive: true });
  await symlink(join(projectRoot, "node_modules"), join(root, "node_modules"), "dir");
  const cvFile = join(root, "content", "cv.yml");
  await writeFile(cvFile, editCv(await readFile(cvFile, "utf8")));

  const astroBin = join(root, "node_modules", "astro", "bin", "astro.mjs");
  let ok = true;
  let stderr = "";
  try {
    await run(process.execPath, [astroBin, "build"], {
      cwd: root,
      env: { ...process.env, ...env },
    });
  } catch (error) {
    ok = false;
    stderr = String((error as { stderr?: string }).stderr ?? error);
  }
  return {
    ok,
    stderr,
    readFileText: (relativePath) => readFile(join(root, "dist", relativePath), "utf8"),
    remove: () => rm(root, { recursive: true, force: true }),
  };
}
