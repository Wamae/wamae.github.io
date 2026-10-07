/**
 * Where the browser window is in the entries it has opened itself.
 * `index` is the current entry, `length` the number of entries reachable by Back and Forward.
 */
export interface HistoryPosition {
  readonly index: number;
  readonly length: number;
}

export const firstPosition: HistoryPosition = { index: 0, length: 1 };

/** Opening a page drops any forward entries, as a real browser does. */
export function afterOpeningPage(position: HistoryPosition): HistoryPosition {
  return { index: position.index + 1, length: position.index + 2 };
}

/**
 * Going Back or Forward lands on an entry that was stored when it was opened, so its stored
 * length is out of date. The entries known so far are kept: only the index comes from the entry.
 */
export function afterTraversal(known: HistoryPosition, stored: HistoryPosition): HistoryPosition {
  return { index: stored.index, length: Math.max(known.length, stored.index + 1) };
}

export const canGoBack = (position: HistoryPosition): boolean => position.index > 0;

export const canGoForward = (position: HistoryPosition): boolean =>
  position.index < position.length - 1;

/** Reads a position back from `history.state`. Anything unexpected gives `null`. */
export function readPosition(state: unknown): HistoryPosition | null {
  if (typeof state !== "object" || state === null) return null;
  const candidate = (state as { desktop?: unknown }).desktop;
  if (typeof candidate !== "object" || candidate === null) return null;
  const { index, length } = candidate as { index?: unknown; length?: unknown };
  if (!Number.isInteger(index) || !Number.isInteger(length)) return null;
  if ((index as number) < 0 || (length as number) <= (index as number)) return null;
  return { index: index as number, length: length as number };
}

/** The value to store in `history.state` for a position. */
export function writePosition(position: HistoryPosition): { desktop: HistoryPosition } {
  return { desktop: position };
}

/**
 * The position after the page was loaded. `stored` comes from `history.state` and `savedLength`
 * from session storage, which is kept up to date, so a reload in the middle of the history
 * still knows how many entries lie ahead. Without a stored position this is a fresh start.
 */
export function restorePosition(
  stored: HistoryPosition | null,
  savedLength: number | null,
  browserLength: number,
): HistoryPosition {
  if (stored === null) return firstPosition;
  // The browser never has more entries than `browserLength`, so a larger saved number is stale.
  const length =
    savedLength !== null &&
    Number.isInteger(savedLength) &&
    savedLength > stored.index &&
    savedLength <= browserLength
      ? savedLength
      : stored.length;
  return { index: stored.index, length };
}
