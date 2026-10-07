import { describe, expect, it } from "vitest";
import { fragmentId } from "./fragment-id";

describe("fragmentId", () => {
  it("drops the hash sign", () => {
    expect(fragmentId("#main")).toBe("main");
    expect(fragmentId("main")).toBe("main");
  });

  it("decodes escapes", () => {
    expect(fragmentId("#a%20b")).toBe("a b");
  });

  it("returns the raw text instead of throwing for a malformed escape", () => {
    expect(fragmentId("#%E0%A4%A")).toBe("%E0%A4%A");
  });

  it("gives an empty id for no fragment", () => {
    expect(fragmentId("")).toBe("");
    expect(fragmentId("#")).toBe("");
  });
});
