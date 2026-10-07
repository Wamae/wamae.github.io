import { describe, expect, it } from "vitest";
import { loadSiteConfig } from "./site-config";

const validEnv = {
  PUBLIC_OWNER_NAME: "Ada Example",
  PUBLIC_OWNER_EMAIL: "ada@example.com",
};

describe("loadSiteConfig", () => {
  it("returns the owner name and email when both are set", () => {
    expect(loadSiteConfig(validEnv)).toEqual({
      ownerName: "Ada Example",
      ownerEmail: "ada@example.com",
    });
  });

  it("trims surrounding whitespace", () => {
    const config = loadSiteConfig({
      PUBLIC_OWNER_NAME: "  Ada Example ",
      PUBLIC_OWNER_EMAIL: " ada@example.com ",
    });
    expect(config.ownerName).toBe("Ada Example");
    expect(config.ownerEmail).toBe("ada@example.com");
  });

  it("fails and names the key when the name is missing", () => {
    expect(() => loadSiteConfig({ PUBLIC_OWNER_EMAIL: "ada@example.com" })).toThrow(
      /PUBLIC_OWNER_NAME is missing or empty/,
    );
  });

  it("fails and names the key when the email is missing", () => {
    expect(() => loadSiteConfig({ PUBLIC_OWNER_NAME: "Ada Example" })).toThrow(
      /PUBLIC_OWNER_EMAIL is missing or empty/,
    );
  });

  it("fails when a value is empty or only whitespace", () => {
    expect(() => loadSiteConfig({ ...validEnv, PUBLIC_OWNER_NAME: "" })).toThrow(
      /PUBLIC_OWNER_NAME is missing or empty/,
    );
    expect(() => loadSiteConfig({ ...validEnv, PUBLIC_OWNER_EMAIL: "   " })).toThrow(
      /PUBLIC_OWNER_EMAIL is missing or empty/,
    );
  });

  it("fails when a value is not a string", () => {
    expect(() => loadSiteConfig({ ...validEnv, PUBLIC_OWNER_NAME: 42 })).toThrow(
      /PUBLIC_OWNER_NAME is missing or empty/,
    );
  });

  it("reports every problem at once", () => {
    expect(() => loadSiteConfig({})).toThrow(/PUBLIC_OWNER_NAME[\s\S]*PUBLIC_OWNER_EMAIL/);
  });

  it("fails when the email has no valid shape", () => {
    expect(() => loadSiteConfig({ ...validEnv, PUBLIC_OWNER_EMAIL: "not-an-email" })).toThrow(
      /not a valid email address/,
    );
  });

  it("rejects the placeholder values from .env.example", () => {
    expect(() =>
      loadSiteConfig({ PUBLIC_OWNER_NAME: "Your Name", PUBLIC_OWNER_EMAIL: "you@example.com" }),
    ).toThrow(
      /PUBLIC_OWNER_NAME is still the placeholder[\s\S]*PUBLIC_OWNER_EMAIL is still the placeholder/,
    );
  });

  it("rejects a placeholder even with different case or spacing", () => {
    expect(() => loadSiteConfig({ ...validEnv, PUBLIC_OWNER_NAME: "  your name " })).toThrow(
      /PUBLIC_OWNER_NAME is still the placeholder/,
    );
    expect(() => loadSiteConfig({ ...validEnv, PUBLIC_OWNER_EMAIL: "You@Example.com" })).toThrow(
      /PUBLIC_OWNER_EMAIL is still the placeholder/,
    );
  });
});
