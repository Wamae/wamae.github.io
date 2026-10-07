import { describe, expect, it } from "vitest";
import { buildAddress } from "./address-url";

describe("buildAddress", () => {
  it("joins the configured site and the page path", () => {
    expect(buildAddress("https://wamae.github.io", "/projects/")).toBe(
      "https://wamae.github.io/projects/",
    );
  });

  it("accepts a URL object and a site written with a trailing slash", () => {
    expect(buildAddress(new URL("https://wamae.github.io/"), "/about/")).toBe(
      "https://wamae.github.io/about/",
    );
  });

  it("gives the site root for the desktop path", () => {
    expect(buildAddress("https://wamae.github.io", "/")).toBe("https://wamae.github.io/");
  });
});
