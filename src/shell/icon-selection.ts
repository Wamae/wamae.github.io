/** Which desktop icon is selected. `null` means none. */
export interface IconSelection {
  readonly selected: string | null;
}

/**
 * How an icon was activated, as far as the script can tell. Only a real mouse is "mouse".
 * Touch, pen, the keyboard and anything unknown (assistive technology, voice control,
 * switch devices, a script) must never be left needing a second action.
 */
export type PointerKind = "mouse" | "touch" | "pen" | "keyboard" | "unknown";

export type IconEvent =
  | { readonly type: "activate"; readonly id: string; readonly pointer: PointerKind }
  | { readonly type: "click-elsewhere" };

export interface IconTransition {
  readonly state: IconSelection;
  /** The icon to open, or `null` when the event only changes the selection. */
  readonly open: string | null;
}

export const nothingSelected: IconSelection = { selected: null };

/**
 * The desktop icon rules, as a pure function. Like Windows, a single click of a real mouse
 * selects an icon, and a second click on the selected icon (a double click, or two single
 * clicks) opens it. Everything else opens at once, so nobody needs a double press.
 */
export function nextIconSelection(state: IconSelection, event: IconEvent): IconTransition {
  if (event.type === "click-elsewhere") {
    return { state: state.selected === null ? state : nothingSelected, open: null };
  }
  const opensAtOnce = event.pointer !== "mouse" || state.selected === event.id;
  return { state: { selected: event.id }, open: opensAtOnce ? event.id : null };
}
