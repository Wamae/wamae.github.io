/** Pure WCAG 2.2 contrast functions. Colours are passed in, nothing is read from the page. */

const HEX_COLOUR = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i;

export interface Rgb {
  readonly red: number;
  readonly green: number;
  readonly blue: number;
}

export function parseHexColour(hex: string): Rgb {
  const match = HEX_COLOUR.exec(hex.trim());
  if (match === null) throw new Error(`Not a six-digit hex colour: "${hex}"`);
  const [, red, green, blue] = match;
  return {
    red: parseInt(red as string, 16),
    green: parseInt(green as string, 16),
    blue: parseInt(blue as string, 16),
  };
}

function linearise(channel: number): number {
  const fraction = channel / 255;
  return fraction <= 0.04045 ? fraction / 12.92 : ((fraction + 0.055) / 1.055) ** 2.4;
}

/** Relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const { red, green, blue } = parseHexColour(hex);
  return 0.2126 * linearise(red) + 0.7152 * linearise(green) + 0.0722 * linearise(blue);
}

/** Contrast ratio, 1 to 21. The order of the two colours does not matter. */
export function contrastRatio(firstHex: string, secondHex: string): number {
  const first = relativeLuminance(firstHex);
  const second = relativeLuminance(secondHex);
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}
