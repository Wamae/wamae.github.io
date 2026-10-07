/** Raw environment: what `import.meta.env` or `process.env` provides. */
export type RawEnvironment = Readonly<Record<string, unknown>>;

export interface SiteConfig {
  readonly ownerName: string;
  readonly ownerEmail: string;
}

// Deliberately loose: it catches typos, not every invalid address.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// The values in .env.example. A build with these would publish placeholder text, so reject them.
const PLACEHOLDERS = {
  PUBLIC_OWNER_NAME: "your name",
  PUBLIC_OWNER_EMAIL: "you@example.com",
} as const;

function readNonEmpty(env: RawEnvironment, key: string): string | undefined {
  const value = env[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

/** Reads one required key. Adds to `problems` and returns undefined when it is unusable. */
function readRequired(
  env: RawEnvironment,
  key: keyof typeof PLACEHOLDERS,
  problems: string[],
): string | undefined {
  const value = readNonEmpty(env, key);
  if (value === undefined) {
    problems.push(`${key} is missing or empty`);
    return undefined;
  }
  if (value.toLowerCase() === PLACEHOLDERS[key]) {
    problems.push(`${key} is still the placeholder from .env.example`);
    return undefined;
  }
  return value;
}

/**
 * Reads and validates the site configuration from the given environment.
 * The environment is passed in, so callers decide where it comes from.
 * Throws one error that lists every problem, so a build fails with a clear message.
 */
export function loadSiteConfig(env: RawEnvironment): SiteConfig {
  const problems: string[] = [];
  const ownerName = readRequired(env, "PUBLIC_OWNER_NAME", problems);
  const ownerEmail = readRequired(env, "PUBLIC_OWNER_EMAIL", problems);

  if (ownerEmail !== undefined && !EMAIL_SHAPE.test(ownerEmail)) {
    problems.push("PUBLIC_OWNER_EMAIL is not a valid email address");
  }

  if (ownerName === undefined || ownerEmail === undefined || problems.length > 0) {
    throw new Error(
      `Invalid site configuration:\n- ${problems.join("\n- ")}\n` +
        "Set them in .env (see .env.example) or as environment variables.",
    );
  }

  return { ownerName, ownerEmail };
}
