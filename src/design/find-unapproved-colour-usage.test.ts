import { describe, expect, it } from "vitest";
import { approvedColourPairs } from "./approved-colour-pairs";
import {
  findUnapprovedColourUsage,
  findUnapprovedStyleAttributes,
} from "./find-unapproved-colour-usage";

const find = (css: string) => findUnapprovedColourUsage(css, approvedColourPairs);

describe("findUnapprovedColourUsage", () => {
  it("accepts an approved pair", () => {
    expect(
      find(".a { color: var(--color-window-text); background: var(--color-window-face); }"),
    ).toEqual([]);
  });

  it("rejects a pair that is not approved", () => {
    const [violation] = find(
      ".a { color: var(--color-bevel-shadow); background-color: var(--color-window-face); }",
    );
    expect(violation).toContain("not an approved pair");
  });

  it("rejects colour literals", () => {
    expect(find(".a { border-color: #fff; }")).toHaveLength(1);
    expect(find(".a { color: rgb(0 0 0); }")).toHaveLength(1);
  });

  it("rejects the raw palette tokens", () => {
    expect(find(".a { color: var(--vga-red); }")).toHaveLength(1);
  });

  it("looks inside media queries and ignores comments", () => {
    const css = `/* #fff */ @media (max-width: 40rem) { .a { color: var(--color-selection-text); background: var(--color-selection-bg); } }`;
    expect(find(css)).toEqual([]);
  });

  it("does not mistake background-color for color", () => {
    expect(find(".a { background-color: var(--color-client-bg); }")).toEqual([]);
  });

  it.each([
    ["a named colour", ".a { color: white; }"],
    ["a named colour in a shorthand", ".a { border: 1px solid red; }"],
    ["a system colour", ".a { background: Canvas; }"],
    ["color-mix()", ".a { color: color-mix(in srgb, var(--color-link), red); }"],
    ["color()", ".a { background: color(display-p3 1 0 0); }"],
    ["a named colour in a box shadow", ".a { box-shadow: 0 0 0 1px gray; }"],
  ])("rejects %s", (_name, css) => {
    expect(find(css).length).toBeGreaterThan(0);
  });

  it("allows transparent, currentColor, inherit and semantic tokens", () => {
    expect(
      find(
        ".a { color: inherit; background: transparent; border: 1px solid currentColor; outline-color: var(--color-focus-ring); }",
      ),
    ).toEqual([]);
  });

  it("does not mistake words in url() or var() names for colours", () => {
    expect(
      find('.a { background-image: url("red.png"); color: var(--color-red-ish, inherit); }'),
    ).toEqual([]);
  });

  it("rejects an outline colour that is not a focus ring colour", () => {
    const [violation] = find(".a { outline: 2px dotted var(--color-bevel-shadow); }");
    expect(violation).toContain("not an approved focus ring colour");
  });

  it("checks an outline drawn inside an element against its background", () => {
    const bad =
      ".a { outline: 2px dotted var(--color-focus-ring); outline-offset: -2px; background: var(--color-selection-bg); }";
    expect(find(bad)[0]).toContain("not an approved pair");
    const good =
      ".a { outline: 2px dotted var(--color-focus-ring-on-selection); outline-offset: -2px; background: var(--color-selection-bg); }";
    expect(find(good)).toEqual([]);
  });

  it("checks a border colour against the background of the same rule", () => {
    const [violation] = find(
      ".a { border: 1px solid var(--color-bevel-shadow); background: var(--color-window-face); }",
    );
    expect(violation).toContain("not an approved pair");
    expect(
      find(
        ".a { border: 1px solid var(--color-window-frame); background: var(--color-window-face); }",
      ),
    ).toEqual([]);
  });

  it("checks scrollbar-color as a thumb and track pair", () => {
    expect(
      find(".a { scrollbar-color: var(--color-bevel-shadow) var(--color-window-face); }")[0],
    ).toContain("not an approved pair");
    expect(
      find(".a { scrollbar-color: var(--color-window-frame) var(--color-window-face); }"),
    ).toEqual([]);
  });
});

describe("findUnapprovedStyleAttributes", () => {
  const findAttr = (source: string) => findUnapprovedStyleAttributes(source, approvedColourPairs);

  it("rejects colour literals in style attributes of markup", () => {
    expect(findAttr('<div style="color: #fff">x</div>')).toHaveLength(1);
    expect(findAttr("<div style='background: red'>x</div>")).toHaveLength(1);
  });

  it("rejects colours in style expressions", () => {
    expect(findAttr("<div style={`color: white`}>x</div>")).toHaveLength(1);
    expect(findAttr('const html = `<p style="border-color: rgb(0 0 0)">`;')).toHaveLength(1);
  });

  it("allows style attributes that use only semantic tokens or no colour", () => {
    expect(findAttr('<div style="color: var(--color-window-text); margin: 0">x</div>')).toEqual([]);
    expect(findAttr('<div style="width: 3rem">x</div>')).toEqual([]);
  });

  it("finds nothing in source without style attributes", () => {
    expect(findAttr('<div class="a">x</div>')).toEqual([]);
  });
});
