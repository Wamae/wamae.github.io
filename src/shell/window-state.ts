/** Where the browser window is: showing, hidden to its taskbar button, or gone from the desktop. */
export type WindowState = "open" | "minimized" | "closed";

/**
 * What can happen to the window. `navigate` is a page opening: a section opens the window
 * (or brings it back), the desktop leaves no window.
 */
export type WindowEvent =
  | { readonly type: "minimize" }
  | { readonly type: "restore" }
  | { readonly type: "toggle" }
  // Closing from the title bar goes through `navigate` to the desktop, as the window is a page.
  // This event stays so the machine describes every way the window can end, and for a later menu.
  | { readonly type: "close" }
  | { readonly type: "toggle-maximize" }
  | { readonly type: "navigate"; readonly target: "section" | "desktop" };

/**
 * The state after an event. An event that does not apply leaves the state as it is:
 * a closed window has no controls, and a minimized window has no title bar to close it from,
 * so it has to be restored first.
 */
export function nextWindowState(state: WindowState, event: WindowEvent): WindowState {
  switch (event.type) {
    case "minimize":
      return state === "open" ? "minimized" : state;
    case "restore":
      return state === "minimized" ? "open" : state;
    case "toggle":
      if (state === "open") return "minimized";
      return state === "minimized" ? "open" : state;
    case "close":
      return state === "open" ? "closed" : state;
    case "navigate":
      return event.target === "section" ? "open" : "closed";
    case "toggle-maximize":
      return state;
  }
}

/** The window's visibility and, separately, whether it fills the desktop. */
export interface WindowModel {
  readonly state: WindowState;
  readonly maximized: boolean;
}

export const noWindow: WindowModel = { state: "closed", maximized: false };

/**
 * The whole window after an event. Maximizing is separate from showing: it can only be toggled
 * while the window is open, it survives minimize and restore, and it ends when the window closes.
 */
export function nextWindow(model: WindowModel, event: WindowEvent): WindowModel {
  const state = nextWindowState(model.state, event);
  if (state === "closed") return noWindow;
  if (event.type === "toggle-maximize" && model.state === "open") {
    return { state, maximized: !model.maximized };
  }
  return { state, maximized: model.maximized };
}

/** The words for a screen reader when the window is maximized or put back to its normal size. */
export function maximizeAnnouncement(maximized: boolean, title: string): string {
  return maximized ? `${title} maximized` : `${title} restored to normal size`;
}

/** The words for a screen reader when the state changes, or `null` when nothing needs saying. */
export function windowAnnouncement(
  from: WindowState,
  to: WindowState,
  title: string,
): string | null {
  if (from === to) return null;
  if (to === "minimized") return `${title} minimized`;
  if (to === "closed") return `${title} closed`;
  return from === "minimized" ? `${title} restored` : null;
}
