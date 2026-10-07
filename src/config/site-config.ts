/** Raw environment: what `import.meta.env` or `process.env` provides. */
export type RawEnvironment = Readonly<Record<string, unknown>>;

export interface SiteConfig {
  readonly ownerName: string;
  readonly ownerEmail: string;
}

const REQUIRED_KEYS = ["PUBLIC_OWNER_NAME", "PUBLIC_OWNER_EMAIL"] as const;

// Deliberately loose: it catches typos, not every invalid address.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readNonEmpty(env: RawEnvironment, key: string): string | undefined {
  const value = env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/**
 * Reads and validates the site configuration from the given environment.
 * The environment is passed in, so callers decide where it comes from.
 * Throws one error that lists every problem, so a build fails with a clear message.
 */
export function loadSiteConfig(env: RawEnvironment): SiteConfig {
  const problems: string[] = [];
  const values = new Map<string, string>();

  for (const key of REQUIRED_KEYS) {
    const value = readNonEmpty(env, key);
    if (value === undefined) {
      problems.push(`${key} is missing or empty`);
    } else {
      values.set(key, value);
    }
  }

  const email = values.get("PUBLIC_OWNER_EMAIL");
  if (email !== undefined && !EMAIL_SHAPE.test(email)) {
    problems.push("PUBLIC_OWNER_EMAIL is not a valid email address");
  }

  if (problems.length > 0) {
    throw new Error(
      `Invalid site configuration:\n- ${problems.join("\n- ")}\n` +
        "Set them in .env (see .env.example) or as environment variables.",
    );
  }

  return {
    ownerName: values.get("PUBLIC_OWNER_NAME") ?? "",
    ownerEmail: email ?? "",
  };
}
