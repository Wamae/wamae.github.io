/** The 16 standard VGA colours as hex values. Colour tokens are limited to these. */
export const vgaPalette = {
  black: "#000000",
  "dark-red": "#800000",
  "dark-green": "#008000",
  "dark-yellow": "#808000",
  "dark-blue": "#000080",
  "dark-magenta": "#800080",
  "dark-cyan": "#008080",
  "light-gray": "#c0c0c0",
  "dark-gray": "#808080",
  red: "#ff0000",
  green: "#00ff00",
  yellow: "#ffff00",
  blue: "#0000ff",
  magenta: "#ff00ff",
  cyan: "#00ffff",
  white: "#ffffff",
} as const;

export type VgaColourName = keyof typeof vgaPalette;
