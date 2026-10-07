/**
 * What a pair is used for. This sets the minimum contrast it must reach (WCAG 2.2 AA):
 * - `text`: normal text, 4.5:1 (SC 1.4.3)
 * - `large-text`: bold text of 14pt or more, or text of 18pt or more, 3:1 (SC 1.4.3)
 * - `ui`: focus rings and other parts needed to use the page, 3:1 (SC 1.4.11 and 2.4.13)
 * - `disabled`: text of a control that is switched off, 2:1. WCAG exempts inactive controls from
 *   SC 1.4.3, and the etched NT look needs dark gray, so the floor is lower but never lets it vanish.
 */
export type PairKind = "text" | "large-text" | "ui" | "disabled";

export const minimumContrast: Readonly<Record<PairKind, number>> = {
  text: 4.5,
  "large-text": 3,
  ui: 3,
  disabled: 2,
};

/** A foreground and a background, named by the semantic tokens in `src/styles/tokens.css`. */
export interface ColourPair {
  readonly id: string;
  readonly foregroundToken: string;
  readonly backgroundToken: string;
  readonly kind: PairKind;
  readonly use: string;
}

/**
 * The only colour pairs the page may use for text, borders, focus rings and scroll bars.
 * Anything else, such as dark gray text on light gray, fails contrast and is not allowed.
 * Bevel highlights and shadows are decorative and carry no information, so they are not listed.
 */
export const approvedColourPairs: readonly ColourPair[] = [
  {
    id: "window-text",
    foregroundToken: "--color-window-text",
    backgroundToken: "--color-window-face",
    kind: "text",
    use: "Text on window frames, panels and the status bar",
  },
  {
    id: "client-text",
    foregroundToken: "--color-client-text",
    backgroundToken: "--color-client-bg",
    kind: "text",
    use: "Body text in a window's client area",
  },
  {
    id: "link-on-client",
    foregroundToken: "--color-link",
    backgroundToken: "--color-client-bg",
    kind: "text",
    use: "Links in a client area",
  },
  {
    id: "link-on-window",
    foregroundToken: "--color-link",
    backgroundToken: "--color-window-face",
    kind: "text",
    use: "Links on a window face or status bar",
  },
  {
    id: "title-active",
    foregroundToken: "--color-title-active-text",
    backgroundToken: "--color-title-active-bg",
    kind: "text",
    use: "Title bar of the active window",
  },
  {
    id: "title-inactive",
    foregroundToken: "--color-title-inactive-text",
    backgroundToken: "--color-title-inactive-bg",
    kind: "text",
    use: "Title bar of an inactive window",
  },
  {
    id: "menu-text",
    foregroundToken: "--color-menu-text",
    backgroundToken: "--color-menu-bg",
    kind: "text",
    use: "Menu bar and menu items",
  },
  {
    id: "button-text",
    foregroundToken: "--color-button-text",
    backgroundToken: "--color-button-face",
    kind: "text",
    use: "Button labels",
  },
  {
    id: "button-disabled-text",
    foregroundToken: "--color-button-disabled-text",
    backgroundToken: "--color-button-face",
    kind: "disabled",
    use: "Label of a button that is switched off, drawn etched with a white offset shadow",
  },
  {
    id: "selection",
    foregroundToken: "--color-selection-text",
    backgroundToken: "--color-selection-bg",
    kind: "text",
    use: "Selected or focused item",
  },
  {
    id: "desktop-text",
    foregroundToken: "--color-desktop-text",
    backgroundToken: "--color-desktop",
    kind: "text",
    use: "Text written straight on the desktop",
  },
  {
    id: "focus-ring-on-window",
    foregroundToken: "--color-focus-ring",
    backgroundToken: "--color-window-face",
    kind: "ui",
    use: "Focus ring on a window face",
  },
  {
    id: "focus-ring-on-client",
    foregroundToken: "--color-focus-ring",
    backgroundToken: "--color-client-bg",
    kind: "ui",
    use: "Focus ring in a client area",
  },
  {
    id: "focus-ring-on-selection",
    foregroundToken: "--color-focus-ring-on-selection",
    backgroundToken: "--color-selection-bg",
    kind: "ui",
    use: "Focus ring on a selected item",
  },
  {
    id: "focus-ring-on-desktop",
    foregroundToken: "--color-focus-ring-on-desktop",
    backgroundToken: "--color-desktop",
    kind: "ui",
    use: "Focus ring on the bare desktop",
  },
  {
    id: "frame-on-window",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-window-face",
    kind: "ui",
    use: "Black frame, border or scroll bar thumb on a window face, panel or scroll bar track",
  },
  {
    id: "frame-on-client",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-client-bg",
    kind: "ui",
    use: "Black frame or border around a client area",
  },
  {
    id: "frame-on-button",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-button-face",
    kind: "ui",
    use: "Black border of a button or scroll bar thumb",
  },
  {
    id: "frame-on-menu",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-menu-bg",
    kind: "ui",
    use: "Black rule under the menu bar",
  },
  {
    id: "frame-on-title-inactive",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-title-inactive-bg",
    kind: "ui",
    use: "Black border around an inactive title bar",
  },
  {
    id: "taskbar-text",
    foregroundToken: "--color-taskbar-text",
    backgroundToken: "--color-taskbar-bg",
    kind: "text",
    use: "Text on the taskbar (task buttons, clock)",
  },
  {
    id: "start-button-text",
    foregroundToken: "--color-start-button-text",
    backgroundToken: "--color-start-button-bg",
    kind: "text",
    use: "Label of the Start button",
  },
  {
    id: "start-menu-text",
    foregroundToken: "--color-start-menu-text",
    backgroundToken: "--color-start-menu-bg",
    kind: "text",
    use: "Group labels and items of the Start menu",
  },
  {
    id: "address-text",
    foregroundToken: "--color-address-text",
    backgroundToken: "--color-address-bg",
    kind: "text",
    use: "The address in the browser window's address bar",
  },
  {
    id: "frame-on-taskbar",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-taskbar-bg",
    kind: "ui",
    use: "Black rule above the taskbar and border of its fields",
  },
  {
    id: "frame-on-start-button",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-start-button-bg",
    kind: "ui",
    use: "Black border of the Start button",
  },
  {
    id: "frame-on-start-menu",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-start-menu-bg",
    kind: "ui",
    use: "Black border of the Start menu",
  },
  {
    id: "frame-on-address",
    foregroundToken: "--color-window-frame",
    backgroundToken: "--color-address-bg",
    kind: "ui",
    use: "Black border of the address bar field",
  },
];
