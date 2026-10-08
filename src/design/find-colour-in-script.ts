/**
 * The colour scan for TypeScript source. The CSS scan cannot see a colour that a script writes, such
 * as `context.fillStyle = "#123456"`, so this one looks for colour literals in script text, and finds
 * which design tokens a script reads by name. Colours in scripts come from tokens, read at run time.
 */

const NAMED_COLOURS = new Set(
  (
    "aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet " +
    "brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan " +
    "darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta " +
    "darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue " +
    "darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey " +
    "dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray " +
    "green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush " +
    "lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray " +
    "lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray " +
    "lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon " +
    "mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue " +
    "mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin " +
    "navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen " +
    "paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple " +
    "rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna " +
    "silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle " +
    "tomato turquoise violet wheat white whitesmoke yellow yellowgreen"
  ).split(" "),
);

/** Takes comments out, so a colour or a token name that only a comment mentions counts for nothing. */
export function stripScriptComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");
}

const IN_STRING = String.raw`["'\`][^"'\`\n]*`;
const HEX = new RegExp(`${IN_STRING}#[0-9a-fA-F]{3,8}\\b`);
const FUNCTION = new RegExp(
  `${IN_STRING}\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color-mix|color)\\(`,
);
const COLOUR_PROPERTY = String.raw`(?:fillStyle|strokeStyle|shadowColor|color|backgroundColor|borderColor|outlineColor|background|fill|stroke|borderTopColor|borderBottomColor|borderLeftColor|borderRightColor|caretColor|accentColor)`;
const ASSIGNED = new RegExp(
  String.raw`\b${COLOUR_PROPERTY}\s*(?:=|:)\s*["'\`]([a-zA-Z]+)["'\`]`,
  "g",
);
const SET_PROPERTY = new RegExp(
  String.raw`setProperty\(\s*["'](?:color|background|background-color|border-color|outline-color|fill|stroke)["']\s*,\s*["']([a-zA-Z]+)["']`,
  "g",
);

/** The colour literals in a script: hex, colour functions, and named colours given to a colour property. */
export function findColourLiteralsInScript(source: string): string[] {
  const code = stripScriptComments(source);
  const found: string[] = [];
  for (const line of code.split("\n")) {
    const hex = HEX.exec(line);
    if (hex !== null) found.push(`hex colour: ${hex[0].trim()}`);
    const fn = FUNCTION.exec(line);
    if (fn !== null) found.push(`colour function: ${fn[0].trim()}`);
  }
  for (const pattern of [ASSIGNED, SET_PROPERTY]) {
    for (const match of code.matchAll(pattern)) {
      const name = (match[1] as string).toLowerCase();
      if (NAMED_COLOURS.has(name)) found.push(`named colour: ${match[0].trim()}`);
    }
  }
  return found;
}

const READ = /getPropertyValue\(\s*["'`](--[a-z0-9-]+)["'`]\s*\)/g;

/** The tokens a script reads with `getPropertyValue("--name")`, ignoring comments and other strings. */
export function findTokensReadByScript(source: string): string[] {
  return [...stripScriptComments(source).matchAll(READ)].map((match) => match[1] as string);
}
