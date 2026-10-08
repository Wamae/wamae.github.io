import { describe, expect, it } from "vitest";
import { parseYamlSource } from "./yaml-source";

const parse = (source: string) => parseYamlSource(source, "sample.yml");
const messageOf = (source: string): string => {
  try {
    parse(source);
  } catch (error) {
    return (error as Error).message;
  }
  throw new Error("expected a YAML error");
};

describe("parseYamlSource", () => {
  it("reads maps, lists and plain values", () => {
    expect(parse("a: 1\nb:\n  - x\n  - y\nc: null\n").data).toEqual({
      a: 1,
      b: ["x", "y"],
      c: null,
    });
  });

  it("keeps a year-month as text and a bare year as a number", () => {
    expect(parse("a: 2012-03\nb: 2012\n").data).toEqual({ a: "2012-03", b: 2012 });
  });

  it("fails with the parser's line and column on a syntax error", () => {
    const message = messageOf("a: 1\nb: [1, 2\nc: 3\n");
    expect(message).toContain("sample.yml is not valid YAML");
    expect(message).toMatch(/\(\d+:\d+\)/);
  });

  it("explains that text with a colon and a space needs quotes", () => {
    const message = messageOf("note: this: that\n");
    expect(message).toContain("(1:");
  });

  it("fails when text starts with an asterisk without quotes, since * starts an alias", () => {
    expect(messageOf("a: **bold** start\n")).toMatch(/\(1:/);
  });

  it("reads a text that starts with a bold marker when it is quoted", () => {
    expect(parse("a: \"**bold** start\"\nb: '**bold** too'\n").data).toEqual({
      a: "**bold** start",
      b: "**bold** too",
    });
  });

  it("rejects duplicate keys", () => {
    expect(messageOf("a: 1\na: 2\n")).toContain("duplicated mapping key");
  });

  it("rejects aliases, which could hide repeated or huge data", () => {
    expect(messageOf("a: &x [1]\nb: *x\n")).toMatch(/alias/i);
  });

  it("allows an anchor that nothing refers to, and it changes nothing", () => {
    expect(parse("a: &x 1\n").data).toEqual({ a: 1 });
  });

  it("rejects tags that would build non-plain data", () => {
    expect(messageOf("a: !!js/function 'x'\n")).toContain("unknown scalar tag");
    expect(messageOf("a: !!python/object {}\n")).toMatch(/tag/);
  });

  it("rejects a document with more than one part", () => {
    expect(messageOf("a: 1\n---\nb: 2\n")).toMatch(/single document|multiple/i);
  });

  describe("lineOf", () => {
    const source = [
      "title: Sample", // 1
      "roles:", // 2
      "  - id: first", // 3
      "    end: 2020", // 4
      "    notes:", // 5
      "      - one", // 6
      "      - two", // 7
      "  - id: second", // 8
      "    end: null", // 9
      "other: 'x'", // 10
    ].join("\n");
    const { lineOf } = parse(source);

    it("finds top-level keys and list items", () => {
      expect(lineOf("title")).toBe(1);
      expect(lineOf("roles")).toBe(2);
      expect(lineOf("roles[0]")).toBe(3);
      expect(lineOf("roles[1]")).toBe(8);
      expect(lineOf("other")).toBe(10);
    });

    it("finds nested keys and items", () => {
      expect(lineOf("roles[0].id")).toBe(3);
      expect(lineOf("roles[0].end")).toBe(4);
      expect(lineOf("roles[0].notes")).toBe(5);
      expect(lineOf("roles[0].notes[1]")).toBe(7);
      expect(lineOf("roles[1].end")).toBe(9);
    });

    it("returns undefined for a path that is not there", () => {
      expect(lineOf("roles[5].end")).toBeUndefined();
    });
  });
});
