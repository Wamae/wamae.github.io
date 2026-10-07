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

const DISABLED_SELECTOR =
  /:disabled\b|\[disabled(?:[~|^$*]?=[^\]]*)?\]|\[aria-disabled=["']?true["']?\]/;
const ANY_VARIABLE = /var\(\s*(--[\w-]+)/g;

/** Resolves CSS escapes, so `\64 isabled` cannot hide a token name. */
function unescapeCss(text: string): string {
  const withHex = text.replace(/\\([0-9a-f]{1,6})[ \t\n]?/gi, (match, hex: string) => {
    const code = parseInt(hex, 16);
    return code > 0x10ffff ? match : String.fromCodePoint(code);
  });
  return withHex.replace(/\\(.)/g, "$1");
}

/** Removes the contents of :has(), :where(), :is() and :not(): they do not say what the colour lands on. */
function withoutFunctionalPseudoClasses(selector: string): string {
  let current = selector;
  for (;;) {
    const next = current.replace(/:(?:has|where|is|not|matches)\([^()]*\)/gi, "");
    if (next === current) return current;
    current = next;
  }
}

/**
 * True when every selector in a list ends in a switched-off control. Only the last compound
 * selector counts, because that is the element that gets the colour: in `.a:disabled + .label`
 * it is the label.
 */
function isDisabledSelector(selector: string): boolean {
  return withoutFunctionalPseudoClasses(unescapeCss(selector))
    .split(",")
    .every((part) => {
      const last =
        part
          .trim()
          .split(/[\s>+~]+/)
          .pop() ?? "";
      return DISABLED_SELECTOR.test(last);
    });
}

/**
 * Custom properties that carry a disabled-only colour, directly or through other custom properties.
 * Using one of them outside a disabled selector is the same as using the colour itself.
 */
function disabledAliases(css: string, disabledTokens: ReadonlySet<string>): Set<string> {
  const names = new Set(disabledTokens);
  const declarations: [string, string][] = [];
  for (const match of css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(RULE)) {
    for (const [property, value] of declarationsOf(unescapeCss(match[2] as string))) {
      if (property.startsWith("--")) declarations.push([property, value]);
    }
  }
  for (let changed = true; changed;) {
    changed = false;
    for (const [property, value] of declarations) {
      if (names.has(property)) continue;
      if ([...value.matchAll(ANY_VARIABLE)].some((m) => names.has(m[1] as string))) {
        names.add(property);
        changed = true;
      }
    }
  }
  return names;
}

function checkBody(
  label: string,
  body: string,
  approved: ReadonlySet<string>,
  approvedUi: ReadonlySet<string>,
  focusRingTokens: ReadonlySet<string>,
  disabledTokens: ReadonlySet<string>,
): string[] {
  const violations: string[] = [];
  // The disabled pairs have a lower contrast floor, so they are allowed on switched-off controls only.
  if (!isDisabledSelector(label)) {
    for (const [, name] of unescapeCss(body).matchAll(ANY_VARIABLE)) {
      if (disabledTokens.has(name as string)) {
        violations.push(`${label}: ${name} is for disabled controls only`);
      }
    }
  }
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
    disabledTokens: new Set(
      approvedPairs.filter((p) => p.kind === "disabled").map((p) => p.foregroundToken),
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
  const {
    approved,
    approvedUi,
    focusRingTokens,
    disabledTokens: disabledColours,
  } = pairSets(approvedPairs);
  const disabledTokens = disabledAliases(withoutComments, disabledColours);
  const violations: string[] = [];

  for (const match of withoutComments.matchAll(RULE)) {
    const selector = (match[1] as string).trim().replace(/\s+/g, " ");
    if (selector.startsWith("@font-face")) continue;
    violations.push(
      ...checkBody(
        selector,
        match[2] as string,
        approved,
        approvedUi,
        focusRingTokens,
        disabledTokens,
      ),
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
  const { approved, approvedUi, focusRingTokens, disabledTokens } = pairSets(approvedPairs);
  const violations: string[] = [];
  for (const match of source.matchAll(STYLE_ATTRIBUTE)) {
    const body = (match[1] ?? match[2] ?? match[3] ?? "").replace(/[`"']/g, "");
    violations.push(
      ...checkBody("style attribute", body, approved, approvedUi, focusRingTokens, disabledTokens),
    );
  }
  return violations;
}
