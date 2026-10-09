import { describe, expect, it } from "vitest";
import { parseLinkRoutes } from "./link-routes-attribute";

describe("parseLinkRoutes", () => {
  it("reads a list of link pages", () => {
    expect(parseLinkRoutes("/links/github/ /links/kaggle/ /links/google-cloud-2/")).toEqual([
      "/links/github/",
      "/links/kaggle/",
      "/links/google-cloud-2/",
    ]);
  });

  it("allows any amount of white space around and between the entries", () => {
    expect(parseLinkRoutes("  /links/a/ \n\t/links/b/   ")).toEqual(["/links/a/", "/links/b/"]);
  });

  it.each([null, undefined, "", "   ", 5 as unknown as string])("gives nothing for %j", (raw) => {
    expect(parseLinkRoutes(raw)).toEqual([]);
  });

  it.each([
    "/about/",
    "/link/github/",
    "/links/",
    "/links//",
    "/links/github",
    "links/github/",
    "/links/GitHub/",
    "/links/../about/",
    "/links/a/../b/",
    "/links/a//b/",
    "/links/a/b/",
    "/links//github/",
    "/links/-a/",
    "/links/a-/",
    "/links/a--b/",
    "/links/a_b/",
    "https://evil.example/links/a/",
    "//evil.example/links/a/",
    "/links/a/?x=1",
    "/links/a/#x",
  ])("drops %s", (entry) => {
    expect(parseLinkRoutes(`/links/ok/ ${entry} /links/also-ok/`)).toEqual([
      "/links/ok/",
      "/links/also-ok/",
    ]);
  });

  it("keeps each path once", () => {
    expect(parseLinkRoutes("/links/a/ /links/b/ /links/a/")).toEqual(["/links/a/", "/links/b/"]);
  });
});
