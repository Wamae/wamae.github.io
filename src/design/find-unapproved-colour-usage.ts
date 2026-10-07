import type { ColourPair } from "./approved-colour-pairs";

const RULE = /([^{}]+)\{([^{}]*)\}/g;
const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/i;
const PALETTE_TOKEN = /var\(\s*--vga-/i;
const COLOUR_TOKEN = /var\(\s*(--color-[a-z0-9-]+)/i;

function readDeclaration(body: string, property: RegExp): string | undefined {
  const declaration = new RegExp(`(?:^|[;\\s])${property.source}\\s*:\\s*([^;]+)`, "i").exec(body);
  return declaration?.[1];
}

function firstColourToken(value: string | undefined): string | undefined {
  return value === undefined ? undefined : COLOUR_TOKEN.exec(value)?.[1];
}

/**
 * Finds colour use that breaks the design-token rules in the given CSS text:
 * colour literals, direct use of the raw VGA tokens, and rules that set both a text colour
 * and a background colour that do not form an approved pair.
 * It checks within one rule at a time. A rule that sets only `color` inherits its background,
 * which this check cannot see, so the page must keep to the approved surfaces.
 * Content of `tokens.css` is expected to be left out by the caller.
 */
export function findUnapprovedColourUsage(
  css: string,
  approvedPairs: readonly ColourPair[],
): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const approved = new Set(approvedPairs.map((p) => `${p.foregroundToken}|${p.backgroundToken}`));
  const violations: string[] = [];

  for (const match of withoutComments.matchAll(RULE)) {
    const selector = (match[1] as string).trim().replace(/\s+/g, " ");
    const body = match[2] as string;
    if (selector.startsWith("@font-face")) continue;

    if (COLOUR_LITERAL.test(body)) violations.push(`${selector}: colour literal`);
    if (PALETTE_TOKEN.test(body)) violations.push(`${selector}: raw --vga-* token used`);

    const text = firstColourToken(readDeclaration(body, /color/));
    const background = firstColourToken(readDeclaration(body, /background(?:-color)?/));
    if (text !== undefined && background !== undefined && !approved.has(`${text}|${background}`)) {
      violations.push(`${selector}: ${text} on ${background} is not an approved pair`);
    }
  }
  return violations;
}
