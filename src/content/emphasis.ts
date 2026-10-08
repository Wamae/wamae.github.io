/** A run of text: plain, or strong (bold). */
export interface Segment {
  readonly kind: "plain" | "strong";
  readonly text: string;
}

export type EmphasisResult =
  | { readonly ok: true; readonly segments: readonly Segment[] }
  | { readonly ok: false; readonly error: string };

const MARKER = "**";

/**
 * Splits text into plain and strong segments. Strong text is written between two `**` markers.
 * The rules are strict, so a typo fails the build instead of showing stray asterisks:
 * - a run of asterisks must be exactly two (a single one, or three or more, is a stray asterisk);
 * - there are no escapes and no nesting;
 * - a marker that opens must be followed by a non-space and one that closes must follow a
 *   non-space, and the strong part may not be empty;
 * - every opened marker must be closed.
 * The result is data, never HTML: the caller renders each segment as text.
 */
export function parseEmphasis(text: string): EmphasisResult {
  const segments: Segment[] = [];
  let open = false;
  let position = 0;
  let current = "";

  const push = (kind: Segment["kind"], value: string) => {
    if (value !== "") segments.push({ kind, text: value });
  };

  while (position < text.length) {
    if (text[position] !== "*") {
      current += text[position];
      position += 1;
      continue;
    }
    let end = position;
    while (text[end] === "*") end += 1;
    if (end - position !== MARKER.length) {
      return { ok: false, error: "stray asterisks: use exactly two (**) around a bold part" };
    }
    const before = text[position - 1];
    const after = text[end];
    const isSpace = (character: string | undefined) =>
      character !== undefined && /\s/u.test(character);

    if (!open) {
      if (after === undefined || isSpace(after)) {
        const closing = before !== undefined && !isSpace(before);
        return {
          ok: false,
          error: closing
            ? "a ** closes a bold part that was never opened"
            : "a bold part may not start with a space or be empty",
        };
      }
      push("plain", current);
      current = "";
      open = true;
    } else if (before === undefined || isSpace(before)) {
      // A marker that cannot close because a space comes before it, but could open: nesting.
      const nesting = after !== undefined && !isSpace(after);
      return {
        ok: false,
        error: nesting
          ? "bold parts may not be nested"
          : "a bold part may not end with a space or be empty",
      };
    } else {
      push("strong", current);
      current = "";
      open = false;
    }
    position = end;
  }

  if (open) return { ok: false, error: "a bold part is never closed (missing **)" };
  push("plain", current);
  return { ok: true, segments: segments.length === 0 ? [{ kind: "plain", text: "" }] : segments };
}

/** The text without markers, for everything that needs plain text (titles, labels, announcements). */
export function stripEmphasis(text: string): string {
  const result = parseEmphasis(text);
  if (result.ok) return result.segments.map((segment) => segment.text).join("");
  return text.replaceAll("*", "");
}
