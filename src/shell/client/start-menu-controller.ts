import { nextMenuAction } from "../menu-navigation";

/**
 * Adds keyboard use, Escape, outside click and focus return to the native Start menu.
 * The menu already opens, closes and navigates without this.
 */
export function bindStartMenu(doc: Document): void {
  const details = doc.querySelector<HTMLDetailsElement>("[data-start-menu]");
  const button = details?.querySelector("summary");
  if (details === null || details === undefined || button === null || button === undefined) return;

  const items = () => [...details.querySelectorAll<HTMLAnchorElement>("nav a")];

  const close = (returnFocus: boolean) => {
    details.open = false;
    if (returnFocus) button.focus();
  };

  details.addEventListener("keydown", (event) => {
    // Leave browser and system shortcuts alone.
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const list = items();
    const index = list.indexOf(doc.activeElement as HTMLAnchorElement);
    const action = nextMenuAction(event.key, {
      isOpen: details.open,
      activeIndex: index < 0 ? null : index,
      itemCount: list.length,
    });
    if (action.type === "none") return;
    event.preventDefault();
    if (action.type === "close") close(true);
    else if (action.type === "open") {
      details.open = true;
      list[action.focusIndex]?.focus();
    } else if (action.type === "focus") list[action.index]?.focus();
    else list[action.index]?.click();
  });

  // Choosing an item closes the menu, whether or not the script then opens the page itself.
  details.addEventListener("click", (event) => {
    if ((event.target as Element).closest("nav a")) close(false);
  });

  doc.addEventListener("click", (event) => {
    if (details.open && !details.contains(event.target as Node)) close(false);
  });

  // Tabbing out of the menu closes it, without moving focus.
  details.addEventListener("focusout", (event) => {
    const next = event.relatedTarget as Node | null;
    if (details.open && next !== null && !details.contains(next)) close(false);
  });
}
