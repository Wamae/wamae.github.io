import {
  effectiveAnimations,
  readChoice,
  saveChoice,
  toggleView,
  type AnimationChoice,
  type ChoiceStore,
} from "../animation-preference";
import { announce } from "./status-region";

/** What the animation controllers ask: are animations on, and tell me when that changes. */
export interface AnimationPreference {
  isEnabled(): boolean;
  onChange(listener: () => void): void;
}

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

/**
 * Keeps `data-animations` on the page in step with the device's reduced motion request and the
 * visitor's saved choice, and drives the Animations button in the taskbar tray. The choice is
 * kept in the store the caller gives it (local storage), per visitor.
 */
export function bindAnimationPreference(
  doc: Document,
  win: Window,
  store: ChoiceStore | null,
): AnimationPreference {
  const reduced = win.matchMedia(reducedMotionQuery);
  let choice: AnimationChoice | null = readChoice(store);
  const listeners: (() => void)[] = [];
  const root = doc.documentElement;

  const inputs = () => ({ osReducedMotion: reduced.matches, choice });

  const apply = () => {
    root.dataset["animations"] = effectiveAnimations(inputs());
    const view = toggleView(inputs());
    for (const button of doc.querySelectorAll<HTMLButtonElement>("[data-animations-toggle]")) {
      button.setAttribute("aria-pressed", String(view.pressed));
      button.setAttribute("aria-label", view.label);
      button.disabled = view.disabled;
      const state = button.querySelector(".state");
      if (state !== null) state.textContent = view.pressed ? "On" : "Off";
    }
    // The Screen Saver item is only there while animations are on.
    for (const item of doc.querySelectorAll<HTMLElement>("[data-needs-animations]")) {
      item.hidden = !view.pressed;
    }
    for (const listener of listeners) listener();
  };

  reduced.addEventListener("change", apply);
  doc.addEventListener("click", (event) => {
    const button = (event.target as Element).closest<HTMLButtonElement>("[data-animations-toggle]");
    if (button === null || button.disabled) return;
    choice = effectiveAnimations(inputs()) === "on" ? "off" : "on";
    saveChoice(store, choice);
    apply();
    announce(doc, toggleView(inputs()).announcement);
  });

  apply();
  return {
    isEnabled: () => root.dataset["animations"] === "on",
    onChange: (listener) => void listeners.push(listener),
  };
}
