import { describe, expect, it } from "vitest";
import { findUnsafeValue, renderEnvFile } from "./env-file.mjs";

describe("renderEnvFile", () => {
  it("writes both settings, quoted and trimmed", () => {
    const text = renderEnvFile({ name: "  Ada Lovelace ", email: "ada@example.org" });

    expect(text).toContain('PUBLIC_OWNER_NAME="Ada Lovelace"');
    expect(text).toContain('PUBLIC_OWNER_EMAIL="ada@example.org"');
    expect(text.endsWith("\n")).toBe(true);
  });

  it("rejects an empty name", () => {
    expect(() => renderEnvFile({ name: "   ", email: "ada@example.org" })).toThrow(
      "Name must not be empty",
    );
  });

  it("rejects an empty email", () => {
    expect(() => renderEnvFile({ name: "Ada", email: "" })).toThrow("Email must not be empty");
  });

  it("rejects a value with a double quote, which would break the line", () => {
    expect(() => renderEnvFile({ name: 'Ada "A" L', email: "ada@example.org" })).toThrow(
      "double quote",
    );
  });

  it("rejects a value with a line break, which would inject another setting", () => {
    expect(() =>
      renderEnvFile({ name: "Ada\nPUBLIC_OWNER_EMAIL=evil@example.org", email: "ada@example.org" }),
    ).toThrow("single line");
  });
});

describe("findUnsafeValue", () => {
  it("accepts an ordinary value", () => {
    expect(findUnsafeValue("Name", "Wamae Benson")).toBeUndefined();
  });
});
