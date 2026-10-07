import { describe, expect, it } from "vitest";
import { resolveInternalRoute } from "./internal-route";

const routes = ["/", "/about/", "/projects/"];
const here = "https://wamae.github.io/";
const resolve = (href: string, current = here) => resolveInternalRoute(href, current, routes);

describe("resolveInternalRoute", () => {
  it("accepts a known page, with or without the trailing slash", () => {
    expect(resolve("/projects/")).toBe("/projects/");
    expect(resolve("/projects")).toBe("/projects/");
    expect(resolve("https://wamae.github.io/about/")).toBe("/about/");
    expect(resolve("/")).toBe("/");
  });

  it("resolves a relative link against the current page", () => {
    expect(resolve("../about/", "https://wamae.github.io/projects/")).toBe("/about/");
  });

  it("ignores a query string and a fragment when matching the page", () => {
    expect(resolve("/projects/?a=1#top")).toBe("/projects/");
  });

  it("leaves other sites, files and unknown pages to the browser", () => {
    expect(resolve("https://example.org/projects/")).toBeNull();
    expect(resolve("/licenses/pixelify-sans-OFL.txt")).toBeNull();
    expect(resolve("/missing/")).toBeNull();
    expect(resolve("mailto:someone@example.org")).toBeNull();
  });

  it("returns null instead of throwing for a malformed URL", () => {
    expect(resolveInternalRoute("/projects/", "not a url", routes)).toBeNull();
  });
});
