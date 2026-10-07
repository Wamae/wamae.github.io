import { describe, expect, it } from "vitest";
import { contrastRatio, parseHexColour, relativeLuminance } from "./contrast";

describe("parseHexColour", () => {
  it("reads the channels", () => {
    expect(parseHexColour("#c0c0c0")).toEqual({ red: 192, green: 192, blue: 192 });
  });

  it("rejects anything that is not six hex digits", () => {
    expect(() => parseHexColour("#fff")).toThrow("Not a six-digit hex colour");
    expect(() => parseHexColour("red")).toThrow();
  });
});

describe("relativeLuminance", () => {
  it("is 0 for black and 1 for white", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#ffffff")).toBeCloseTo(1, 10);
  });
});

describe("contrastRatio", () => {
  it("is 21 for black on white, in either order", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("is 1 for identical colours", () => {
    expect(contrastRatio("#808080", "#808080")).toBeCloseTo(1, 10);
  });

  it("matches a known WCAG value: #808080 on white is about 3.95", () => {
    expect(contrastRatio("#808080", "#ffffff")).toBeCloseTo(3.95, 2);
  });
});
