import { describe, expect, it } from "vitest";
import { findCurrency } from "./currency-rule";

describe("findCurrency", () => {
  it.each([
    ["$5", "$"],
    ["Raised $ 2 million", "$"],
    ["a saving of 5£", "£"],
    ["€10", "€"],
    ["¢5", "¢"],
    ["＄5", "＄"],
    ["﹩5", "﹩"],
    ["₹50", "₹"],
    ["worth 100 USD", "USD"],
    ["USD500", "USD"],
    ["KES 5000", "KES"],
    ["KES500", "KES"],
    ["Ksh500", "Ksh"],
    ["Kshs 20", "Kshs"],
    ["Sh 500", "Sh"],
    ["Shs. 500", "Shs."],
    ["500/=", "/="],
    ["revenue of 3 million dollars", "dollars"],
    ["paid in shillings", "shillings"],
    ["1 million pounds", "pounds"],
    ["10 naira", "naira"],
    ["50 rupees", "rupees"],
    ["saved euros", "euros"],
  ])("finds the currency in %j", (text, expected) => {
    expect(findCurrency(text)).toBe(expected);
  });

  it("sees through zero-width and soft-hyphen characters", () => {
    expect(findCurrency("U​SD 5")).toBe("USD");
    expect(findCurrency("K­ES 5")).toBe("KES");
    expect(findCurrency("$​5")).toBe("$");
  });

  it.each([
    "Revenue grew by 80%",
    "Over 100K workers were paid on time",
    "Used by over 10 million customers",
    "A 3X increase in outgoing transactions revenue",
    "Cut onboarding from 3 months to 3-4 weeks",
    "Saved 1000+ hours",
    "Free M-PESA for merchants",
    "Kopo Kopo Inc",
    "Used CAD tools",
    "Wrote inr and usd as plain words",
    "Worked with the Kusd and Pound-Street teams",
    "Shipped in 2 weeks, then Sharing 5 demos",
  ])("accepts %j", (text) => {
    expect(findCurrency(text)).toBeUndefined();
  });
});

describe("findCurrency with terms from the CV", () => {
  it.each(["during COVID-19 and GDPR issues", "COVID-19", "GDPR"])("accepts %j", (text) => {
    expect(findCurrency(text)).toBeUndefined();
  });
});
