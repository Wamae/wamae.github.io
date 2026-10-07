import { nextIconSelection, nothingSelected, type PointerKind } from "../icon-selection";

function pointerOf(event: MouseEvent): PointerKind {
  if (event.detail === 0) return "keyboard";
  if (!(event instanceof PointerEvent)) return "unknown";
  switch (event.pointerType) {
    case "mouse":
    case "touch":
    case "pen":
      return event.pointerType;
    default:
      return "unknown";
  }
}

/**
 * Makes a single click of a real mouse select a desktop icon, and a click on the selected icon
 * (so a double click) open it. The icons stay real links. Enter, touch, pen and anything
 * unknown open at once, and without this script a single click opens them. Opening is left to
 * the click itself, which the section navigation handles.
 */
export function bindDesktopIcons(doc: Document): void {
  const icons = [...doc.querySelectorAll<HTMLAnchorElement>("[data-desktop-icon]")];
  if (icons.length === 0) return;
  let state = nothingSelected;

  const paint = () => {
    for (const icon of icons) {
      if (icon.getAttribute("href") === state.selected) icon.dataset["selected"] = "true";
      else delete icon.dataset["selected"];
    }
  };

  doc.addEventListener("click", (event) => {
    const icon = (event.target as Element).closest<HTMLAnchorElement>("[data-desktop-icon]");
    if (icon === null) {
      state = nextIconSelection(state, { type: "click-elsewhere" }).state;
      paint();
      return;
    }
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const id = icon.getAttribute("href") ?? "";
    const result = nextIconSelection(state, { type: "activate", id, pointer: pointerOf(event) });
    state = result.state;
    paint();
    // A click that only selects must not follow the link, and keeps focus on the icon.
    if (result.open === null) {
      event.preventDefault();
      icon.focus();
    }
  });
}
