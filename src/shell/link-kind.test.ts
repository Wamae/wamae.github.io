import { describe, expect, it } from "vitest";
import { canEmbed, classifyLink } from "./link-kind";

const here = "https://wamae.github.io/projects/";
const kind = (href: string, current = here) => classifyLink(href, current);

describe("classifyLink", () => {
  it("treats a page of this site as internal, however it is written", () => {
    expect(kind("/about/")).toBe("internal");
    expect(kind("../about/")).toBe("internal");
    expect(kind("https://wamae.github.io/contact/")).toBe("internal");
    expect(kind("#top")).toBe("internal");
    expect(kind("/licenses/pixelify-sans-OFL.txt")).toBe("internal");
  });

  it("treats a web page on another site as external", () => {
    expect(kind("https://github.com/Wamae")).toBe("external");
    expect(kind("http://example.org/")).toBe("external");
    expect(kind("//example.org/path")).toBe("external");
  });

  it("does not mistake a look-alike host or another port for this site", () => {
    expect(kind("https://wamae.github.io.evil.example/")).toBe("external");
    expect(kind("https://wamae.github.io:8443/")).toBe("external");
    expect(kind("http://wamae.github.io/")).toBe("external");
    expect(kind("https://user@wamae.github.io@evil.example/")).toBe("external");
  });

  it("treats mail, phone and text links as handing over to another app", () => {
    expect(kind("mailto:someone@example.org")).toBe("handoff");
    expect(kind("MAILTO:someone@example.org")).toBe("handoff");
    expect(kind("tel:+123456")).toBe("handoff");
    expect(kind("sms:+123456")).toBe("handoff");
  });

  it("refuses anything that is not a web page or a hand-over", () => {
    expect(kind("javascript:alert(1)")).toBe("unsupported");
    expect(kind(" JaVaScRiPt:alert(1)")).toBe("unsupported");
    expect(kind("data:text/html,<p>hi</p>")).toBe("unsupported");
    expect(kind("blob:https://wamae.github.io/1234")).toBe("unsupported");
    expect(kind("file:///etc/passwd")).toBe("unsupported");
    expect(kind("ftp://example.org/")).toBe("unsupported");
  });

  it("refuses a malformed address or a malformed current page", () => {
    expect(kind("http://")).toBe("unsupported");
    expect(kind("https://exa mple.org/")).toBe("unsupported");
    expect(kind("/about/", "not a url")).toBe("unsupported");
  });
});

describe("canEmbed", () => {
  it("tries to frame an https page by default", () => {
    expect(canEmbed("https://www.kaggle.com/someone", undefined)).toBe(true);
    expect(canEmbed("https://www.kaggle.com/someone", true)).toBe(true);
  });

  it("does not frame a page whose link is marked as not embeddable", () => {
    expect(canEmbed("https://github.com/Wamae", false)).toBe(false);
  });

  it("never frames a page that is not https, because the browser would block it", () => {
    expect(canEmbed("http://example.org/", undefined)).toBe(false);
    expect(canEmbed("http://example.org/", true)).toBe(false);
  });

  it("never frames something that is not a web address", () => {
    expect(canEmbed("javascript:alert(1)", true)).toBe(false);
    expect(canEmbed("mailto:someone@example.org", true)).toBe(false);
    expect(canEmbed("not a url", true)).toBe(false);
  });
});
