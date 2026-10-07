/**
 * Results are published as percentages only. This rule keeps currency out of the text.
 * It rejects, after removing invisible format characters (zero-width and soft-hyphen splits):
 * - any currency symbol (Unicode category Sc, for example $ £ € ¥ ¢ and the full-width forms);
 * - a currency code written in its own case, not touching other letters, so "USD500" and
 *   "KES 5" are found while "CAD tools" or a lowercase "inr" are not (CAD is left out on purpose);
 * - Kenyan "Sh" or "Shs" followed by an amount, and an amount followed by "/=";
 * - a currency name as a whole word: dollars, shillings, euros, pounds, naira, rupees.
 * Percentages and multiples such as "3X" are fine.
 */
const INVISIBLE = /\p{Cf}/gu;
const SYMBOLS = /\p{Sc}/u;
const CODES =
  /(?<![A-Za-z])(?:USD|EUR|GBP|KES|KSH|KSh|Ksh|Kshs|UGX|TZS|ZAR|NGN|GHS|RWF|JPY|CNY|INR|CHF|AUD)(?![A-Za-z])/;
const SHILLING_FORMS = /(?<![A-Za-z])Shs?\.?(?=\s*\d)|(?<=\d\s*)\/=/;
const NAMES = /\b(?:dollars?|shillings?|euros?|pounds|naira|rupees?)\b/i;

/** Returns what was found (for the error message), or undefined when the text is clean. */
export function findCurrency(text: string): string | undefined {
  const clean = text.replace(INVISIBLE, "");
  const found =
    SYMBOLS.exec(clean) ?? CODES.exec(clean) ?? SHILLING_FORMS.exec(clean) ?? NAMES.exec(clean);
  return found?.[0];
}
