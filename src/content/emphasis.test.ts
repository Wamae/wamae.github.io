import { describe, expect, it } from "vitest";
import { parseEmphasis, stripEmphasis, type EmphasisResult } from "./emphasis";

const segments = (text: string) => {
  const result = parseEmphasis(text);
  if (!result.ok) throw new Error(`unexpected error: ${result.error}`);
  return result.segments;
};
const errorOf = (text: string): string => {
  const result: EmphasisResult = parseEmphasis(text);
  if (result.ok) throw new Error("expected an error");
  return result.error;
};

describe("parseEmphasis", () => {
  it("returns one plain segment when there is no marker", () => {
    expect(segments("Plain text.")).toEqual([{ kind: "plain", text: "Plain text." }]);
  });

  it("splits text into plain and strong segments", () => {
    expect(segments("Up by **80%** in a year")).toEqual([
      { kind: "plain", text: "Up by " },
      { kind: "strong", text: "80%" },
      { kind: "plain", text: " in a year" },
    ]);
  });

  it("handles a marked part at the very start and the very end", () => {
    expect(segments("**3X** growth")).toEqual([
      { kind: "strong", text: "3X" },
      { kind: "plain", text: " growth" },
    ]);
    expect(segments("grew **3X**")).toEqual([
      { kind: "plain", text: "grew " },
      { kind: "strong", text: "3X" },
    ]);
  });

  it("handles text that is only a marked part", () => {
    expect(segments("**100K**")).toEqual([{ kind: "strong", text: "100K" }]);
  });

  it("allows several marked parts, also next to each other with a space between", () => {
    expect(segments("**3 months** to **3-4 weeks**").map((s) => s.kind)).toEqual([
      "strong",
      "plain",
      "strong",
    ]);
    expect(segments("**a** **b**").map((s) => s.text)).toEqual(["a", " ", "b"]);
  });

  it("allows a marked part inside a word", () => {
    expect(segments("un**believ**able").map((s) => s.text)).toEqual(["un", "believ", "able"]);
  });

  it("keeps unicode text, accents and emoji", () => {
    expect(segments("café **naïve ✓** 日本語")).toEqual([
      { kind: "plain", text: "café " },
      { kind: "strong", text: "naïve ✓" },
      { kind: "plain", text: " 日本語" },
    ]);
  });

  it("keeps HTML-looking text as plain text, never as markup", () => {
    expect(segments("<b>x</b> **<i>y</i>**")).toEqual([
      { kind: "plain", text: "<b>x</b> " },
      { kind: "strong", text: "<i>y</i>" },
    ]);
  });

  it("rejects an unclosed marker", () => {
    expect(errorOf("**open only")).toContain("never closed");
  });

  it("rejects a marker that is never opened", () => {
    expect(errorOf("closes only**")).toContain("never opened");
  });

  it("rejects an empty marked part", () => {
    expect(errorOf("a **** b")).toContain("stray asterisks");
    expect(errorOf("a ** ** b")).toContain("space");
  });

  it("rejects adjacent markers with nothing between them", () => {
    expect(errorOf("**a****b**")).toContain("stray asterisks");
  });

  it("rejects nested markers", () => {
    expect(errorOf("**a **b** c**")).toContain("nested");
  });

  it("rejects a single asterisk and three or more in a row", () => {
    expect(errorOf("5 * 3")).toContain("stray asterisks");
    expect(errorOf("***a***")).toContain("stray asterisks");
  });

  it("rejects a marker that has a space inside its edge", () => {
    expect(errorOf("** a**")).toContain("space");
    expect(errorOf("**a **")).toContain("space");
  });

  it("has no escape character: a backslash is plain text and does not hide a marker", () => {
    expect(segments("a\\b")).toEqual([{ kind: "plain", text: "a\\b" }]);
    expect(segments("\\**a**")).toEqual([
      { kind: "plain", text: "\\" },
      { kind: "strong", text: "a" },
    ]);
  });
});

describe("stripEmphasis", () => {
  it("removes the markers and keeps the words", () => {
    expect(stripEmphasis("Up by **80%** and **3X**")).toBe("Up by 80% and 3X");
  });

  it("leaves text without markers unchanged", () => {
    expect(stripEmphasis("Plain")).toBe("Plain");
  });

  it("never leaves a marker behind, even in invalid text", () => {
    expect(stripEmphasis("**open and ****x")).not.toContain("*");
  });
});

describe("terms with a hyphen or capitals", () => {
  it("marks COVID-19 and GDPR as strong", () => {
    expect(segments("during **COVID-19** and **GDPR** issues")).toEqual([
      { kind: "plain", text: "during " },
      { kind: "strong", text: "COVID-19" },
      { kind: "plain", text: " and " },
      { kind: "strong", text: "GDPR" },
      { kind: "plain", text: " issues" },
    ]);
  });
});
