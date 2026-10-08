import { describe, expect, it } from "vitest";
import {
  findColourLiteralsInScript,
  findTokensReadByScript,
  stripScriptComments,
} from "./find-colour-in-script";

describe("findColourLiteralsInScript", () => {
  it.each([
    ['context.fillStyle = "#123456";', "hex"],
    ["context.strokeStyle = '#fff';", "hex"],
    ["el.style.cssText = `border: 1px solid #00ff00`;", "hex"],
    ['const c = "rgb(0, 0, 0)";', "function"],
    ['const c = "rgba(0,0,0,.5)";', "function"],
    ['const c = "hsl(120 100% 50%)";', "function"],
    ['const c = "color-mix(in srgb, red, blue)";', "function"],
    ['const c = "color(display-p3 1 0 0)";', "function"],
    ['context.fillStyle = "red";', "named"],
    ['context.strokeStyle = "Cyan";', "named"],
    ['ctx.shadowColor = "black";', "named"],
    ['element.style.backgroundColor = "white";', "named"],
    ['element.style.setProperty("color", "purple");', "named"],
    ['Object.assign(el.style, { color: "tomato" });', "named"],
  ])("finds a colour in %s", (source, kind) => {
    const found = findColourLiteralsInScript(source);
    expect(found).toHaveLength(1);
    expect(found[0]).toContain(kind);
  });

  it.each([
    "context.fillStyle = colours.background;",
    'const value = style.getPropertyValue("--color-screensaver-bg").trim();',
    'element.style.color = "var(--color-window-text)";',
    'element.style.background = "transparent";',
    'element.style.color = "currentColor";',
    'const url = "https://example.org/#top";',
    "const n = 0xff00ff;",
    'element.dataset["color"] = "red"; // not a style',
    "class Box { #cache = 1; }",
  ])("finds no colour in %s", (source) => {
    expect(findColourLiteralsInScript(source)).toEqual([]);
  });

  it("ignores a colour that only a comment mentions", () => {
    expect(
      findColourLiteralsInScript('// context.fillStyle = "#123456";\n/* "rgb(0,0,0)" */'),
    ).toEqual([]);
  });

  it("finds each colour when there are several", () => {
    expect(
      findColourLiteralsInScript(
        'a.fillStyle = "red";\nb.strokeStyle = "#abc";\nc = "rgb(1,2,3)";',
      ),
    ).toHaveLength(3);
  });
});

describe("findTokensReadByScript", () => {
  it("finds a token read with getPropertyValue", () => {
    expect(
      findTokensReadByScript(
        "const a = style.getPropertyValue(\"--color-screensaver-bg\").trim();\nconst b = s.getPropertyValue( '--color-x' );",
      ),
    ).toEqual(["--color-screensaver-bg", "--color-x"]);
  });

  it("does not count a quoted name that is not read, or one in a comment", () => {
    expect(
      findTokensReadByScript(
        '// style.getPropertyValue("--color-in-comment")\nconst name = "--color-just-a-string";\n/* getPropertyValue("--color-block") */',
      ),
    ).toEqual([]);
  });
});

describe("stripScriptComments", () => {
  it("removes line and block comments but keeps URLs in strings", () => {
    expect(stripScriptComments('a(); // gone\nb("http://x.y"); /* gone */ c();')).toBe(
      'a(); \nb("http://x.y");  c();',
    );
  });
});
