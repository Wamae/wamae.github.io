import type { ColourPair } from "./approved-colour-pairs";

const RULE = /([^{}]+)\{([^{}]*)\}/g;
const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch)\(/i;
const COLOUR_FUNCTION = /\b(?:color-mix|color|light-dark)\(/i;
const PALETTE_TOKEN = /var\(\s*--vga-/i;
const COLOUR_TOKEN = /var\(\s*(--color-[a-z0-9-]+)/i;
const COLOUR_TOKENS = /var\(\s*(--color-[a-z0-9-]+)/gi;

/** Properties whose values are colours or contain colours. */
const COLOUR_PROPERTY =
  /^(?:color|background(?:-color|-image)?|border(?:-(?:top|right|bottom|left))?(?:-color)?|outline(?:-color)?|box-shadow|text-shadow|fill|stroke|caret-color|accent-color|text-decoration(?:-color)?|scrollbar-color|column-rule(?:-color)?|-webkit-text-fill-color)$/;
const BORDER_PROPERTY = /^border(?:-(?:top|right|bottom|left))?(?:-color)?$/;
const OUTLINE_PROPERTY = /^outline(?:-color)?$/;

/** The CSS named and system colours. Only transparent, currentColor and inherit are allowed. */
const NAMED_COLOURS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown " +
    "burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan " +
    "darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid " +
    "darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet " +
    "deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro " +
    "ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki " +
    "lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow " +
    "lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine " +
    "mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise " +
    "mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab " +
    "orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru " +
    "pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown " +
    "seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan " +
    "teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen canvas canvastext " +
    "buttonface buttontext highlight highlighttext window windowtext windowframe graytext linktext " +
    "activetext visitedtext field fieldtext mark marktext selecteditem selecteditemtext accentcolor " +
    "accentcolortext"
  ).split(" "),
);

function declarationsOf(body: string): Map<string, string> {
  const declarations = new Map<string, string>();
  for (const part of body.split(";")) {
    const colon = part.indexOf(":");
    if (colon < 0) continue;
    declarations.set(part.slice(0, colon).trim().toLowerCase(), part.slice(colon + 1).trim());
  }
  return declarations;
}

function firstColourToken(value: string | undefined): string | undefined {
  return value === undefined ? undefined : COLOUR_TOKEN.exec(value)?.[1];
}

function colourTokens(value: string | undefined): string[] {
  return value === undefined ? [] : [...value.matchAll(COLOUR_TOKENS)].map((m) => m[1] as string);
}

/** True when the value uses a named or system colour. Names inside url() and var() names are ignored. */
function usesNamedColour(value: string): boolean {
  const words = value
    .replace(/url\([^)]*\)/gi, " ")
    .replace(/var\(\s*--[\w-]+\s*,?([^()]*)\)/gi, " $1 ")
    .toLowerCase()
    .match(/[a-z]+(?:-[a-z]+)*/g);
  return (words ?? []).some((word) => NAMED_COLOURS.has(word));
}

function checkBody(
  label: string,
  body: string,
  approved: ReadonlySet<string>,
  approvedUi: ReadonlySet<string>,
  focusRingTokens: ReadonlySet<string>,
): string[] {
  const violations: string[] = [];
  if (COLOUR_LITERAL.test(body)) violations.push(`${label}: colour literal`);
  if (COLOUR_FUNCTION.test(body)) violations.push(`${label}: colour function`);
  if (PALETTE_TOKEN.test(body)) violations.push(`${label}: raw --vga-* token used`);

  const declarations = declarationsOf(body);
  for (const [property, value] of declarations) {
    if (COLOUR_PROPERTY.test(property) && usesNamedColour(value)) {
      violations.push(`${label}: named colour in ${property}`);
    }
  }

  const text = firstColourToken(declarations.get("color"));
  const background = firstColourToken(
    declarations.get("background-color") ?? declarations.get("background"),
  );
  const checkPair = (foreground: string | undefined, against: string | undefined, kind: string) => {
    if (foreground === undefined || against === undefined) return;
    const key = `${foreground}|${against}`;
    if (!(kind === "ui" ? approvedUi : approved).has(key)) {
      violations.push(`${label}: ${foreground} on ${against} is not an approved pair`);
    }
  };
  checkPair(text, background, "text");

  for (const [property, value] of declarations) {
    if (BORDER_PROPERTY.test(property)) {
      // A border sits on the element's own background.
      checkPair(firstColourToken(value), background, "any");
    }
    if (OUTLINE_PROPERTY.test(property)) {
      const ring = firstColourToken(value);
      if (ring !== undefined && !focusRingTokens.has(ring)) {
        violations.push(`${label}: ${ring} is not an approved focus ring colour`);
      } else if (ring !== undefined && (declarations.get("outline-offset") ?? "").startsWith("-")) {
        // Only a ring drawn inside the element is known to sit on this rule's background.
        checkPair(ring, background, "ui");
      }
    }
  }

  const scrollbar = colourTokens(declarations.get("scrollbar-color"));
  if (scrollbar.length === 2) checkPair(scrollbar[0], scrollbar[1], "ui");
  return violations;
}

function pairSets(approvedPairs: readonly ColourPair[]) {
  const key = (p: ColourPair) => `${p.foregroundToken}|${p.backgroundToken}`;
  return {
    approved: new Set(approvedPairs.map(key)),
    approvedUi: new Set(approvedPairs.filter((p) => p.kind === "ui").map(key)),
    focusRingTokens: new Set(
      approvedPairs.filter((p) => p.kind === "ui").map((p) => p.foregroundToken),
    ),
  };
}

/**
 * Finds colour use that breaks the design-token rules in the given CSS text:
 * colour literals, colour functions, named colours (only transparent, currentColor and inherit
 * are allowed), direct use of the raw VGA tokens, and rules that set a text, border, outline or
 * scroll bar colour together with a background that do not form an approved pair.
 * Outline colours must always be the foreground of an approved `ui` pair.
 * It checks within one rule at a time. A rule that sets only `color` inherits its background,
 * and an outline drawn outside an element sits on a surface this check cannot see, so the page
 * must keep to the approved surfaces.
 * Content of `tokens.css` is expected to be left out by the caller.
 */
export function findUnapprovedColourUsage(
  css: string,
  approvedPairs: readonly ColourPair[],
): string[] {
  const withoutComments = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const { approved, approvedUi, focusRingTokens } = pairSets(approvedPairs);
  const violations: string[] = [];

  for (const match of withoutComments.matchAll(RULE)) {
    const selector = (match[1] as string).trim().replace(/\s+/g, " ");
    if (selector.startsWith("@font-face")) continue;
    violations.push(
      ...checkBody(selector, match[2] as string, approved, approvedUi, focusRingTokens),
    );
  }
  return violations;
}

const STYLE_ATTRIBUTE = /\bstyle\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;

/**
 * Applies the same rules to `style="..."` attributes in markup and script source
 * (.astro and .ts files).
 */
export function findUnapprovedStyleAttributes(
  source: string,
  approvedPairs: readonly ColourPair[],
): string[] {
  const { approved, approvedUi, focusRingTokens } = pairSets(approvedPairs);
  const violations: string[] = [];
  for (const match of source.matchAll(STYLE_ATTRIBUTE)) {
    const body = (match[1] ?? match[2] ?? match[3] ?? "").replace(/[`"']/g, "");
    violations.push(...checkBody("style attribute", body, approved, approvedUi, focusRingTokens));
  }
  return violations;
}
