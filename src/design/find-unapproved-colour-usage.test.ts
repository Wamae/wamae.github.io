import { describe, expect, it } from "vitest";
import { approvedColourPairs } from "./approved-colour-pairs";
import { findUnapprovedColourUsage } from "./find-unapproved-colour-usage";

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
});
