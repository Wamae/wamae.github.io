/** What the Start menu looks like at the moment a key is pressed. */
export interface MenuContext {
  readonly isOpen: boolean;
  /** The focused item, or `null` when focus is on the Start button. */
  readonly activeIndex: number | null;
  readonly itemCount: number;
}

/** What the menu should do in answer to a key. The caller does the DOM work. */
export type MenuAction =
  | { readonly type: "none" }
  | { readonly type: "open"; readonly focusIndex: number }
  | { readonly type: "focus"; readonly index: number }
  | { readonly type: "close" }
  | { readonly type: "activate"; readonly index: number };

const none: MenuAction = { type: "none" };

function moveWithinItems(key: string, from: number | null, count: number): number | null {
  const last = count - 1;
  switch (key) {
    case "ArrowDown":
      return from === null ? 0 : (from + 1) % count;
    case "ArrowUp":
      return from === null ? last : (from - 1 + count) % count;
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return null;
  }
}

/**
 * The keyboard rules of the Start menu, as a pure function.
 * Enter on the Start button and on a link is left to the browser, which already opens the
 * disclosure and follows the link. Space does nothing on a link, so it is handled here.
 * Closing always returns focus to the Start button.
 */
export function nextMenuAction(key: string, context: MenuContext): MenuAction {
  const { isOpen, activeIndex, itemCount } = context;
  if (!isOpen) {
    if (itemCount === 0) return none;
    if (key === "ArrowDown") return { type: "open", focusIndex: 0 };
    if (key === "ArrowUp") return { type: "open", focusIndex: itemCount - 1 };
    return none;
  }
  if (key === "Escape") return { type: "close" };
  if (itemCount === 0) return none;
  if (key === " " && activeIndex !== null) return { type: "activate", index: activeIndex };
  const index = moveWithinItems(key, activeIndex, itemCount);
  return index === null ? none : { type: "focus", index };
}
