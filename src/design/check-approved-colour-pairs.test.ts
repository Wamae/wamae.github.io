import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { approvedColourPairs, type ColourPair } from "./approved-colour-pairs";
import { checkApprovedColourPairs } from "./check-approved-colour-pairs";
import { readCustomProperties, resolveCustomProperty } from "./resolve-colour-tokens";
import { vgaPalette } from "./vga-palette";

const tokensCss = readFileSync(new URL("../styles/tokens.css", import.meta.url), "utf8");
const properties = readCustomProperties(tokensCss);

describe("the real design tokens", () => {
  it("declares exactly the 16 VGA colours with the values in the palette module", () => {
    for (const [name, hex] of Object.entries(vgaPalette)) {
      expect(properties.get(`--vga-${name}`), `--vga-${name}`).toBe(hex);
    }
    const declared = [...properties.keys()].filter((key) => key.startsWith("--vga-"));
    expect(declared).toHaveLength(Object.keys(vgaPalette).length);
  });

  it("resolves every semantic colour token to a palette colour", () => {
    const palette = new Set<string>(Object.values(vgaPalette));
    for (const name of properties.keys()) {
      if (!name.startsWith("--color-")) continue;
      expect(palette.has(resolveCustomProperty(properties, name)), name).toBe(true);
    }
  });

  it("meets the minimum contrast for every approved pair", () => {
    const failing = checkApprovedColourPairs(approvedColourPairs, properties).filter(
      (result) => !result.passes,
    );
    expect(
      failing.map(
        (r) =>
          `${r.pair.id}: ${r.ratio.toFixed(2)}:1, needs ${r.required}:1 (${r.foreground} on ${r.background})`,
      ),
    ).toEqual([]);
  });

  it("has unique pair ids", () => {
    const ids = approvedColourPairs.map((pair) => pair.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("checkApprovedColourPairs", () => {
  const tokens = new Map([
    ["--fg-dark", "#000000"],
    ["--bg-light", "#ffffff"],
    ["--fg-weak", "#808080"],
    ["--fg-alias", "var(--fg-dark)"],
  ]);
  const pair = (foregroundToken: string, kind: ColourPair["kind"]): ColourPair => ({
    id: "test",
    foregroundToken,
    backgroundToken: "--bg-light",
    kind,
    use: "test",
  });

  it("passes a high-contrast pair and follows aliases", () => {
    const [result] = checkApprovedColourPairs([pair("--fg-alias", "text")], tokens);
    expect(result?.passes).toBe(true);
    expect(result?.foreground).toBe("#000000");
  });

  it("fails normal text below 4.5:1", () => {
    const [result] = checkApprovedColourPairs([pair("--fg-weak", "text")], tokens);
    expect(result?.ratio).toBeCloseTo(3.95, 2);
    expect(result?.passes).toBe(false);
  });

  it("accepts the same pair as large text or a UI part, which need only 3:1", () => {
    const results = checkApprovedColourPairs(
      [pair("--fg-weak", "large-text"), pair("--fg-weak", "ui")],
      tokens,
    );
    expect(results.map((r) => r.passes)).toEqual([true, true]);
  });

  it("throws when a token is not defined", () => {
    expect(() => checkApprovedColourPairs([pair("--missing", "text")], tokens)).toThrow(
      "--missing is not defined",
    );
  });
});
