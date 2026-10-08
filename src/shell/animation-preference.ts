const key = "desktop-animations";

/** The visitor's own choice. `null` means they have not made one. */
export type AnimationChoice = "on" | "off";

/** The part of `Storage` that is used, so a fake can stand in for it. */
export type ChoiceStore = Pick<Storage, "getItem" | "setItem">;

export interface AnimationInputs {
  /** The device asks for reduced motion (`prefers-reduced-motion: reduce`). */
  readonly osReducedMotion: boolean;
  readonly choice: AnimationChoice | null;
}

/** Animations run only if the device does not ask for less motion and the visitor has not turned them off. */
export function effectiveAnimations(inputs: AnimationInputs): AnimationChoice {
  if (inputs.osReducedMotion) return "off";
  return inputs.choice === "off" ? "off" : "on";
}

/** A stored value is either of the two words this code saved. Anything else is ignored. */
export function parseChoice(raw: unknown): AnimationChoice | null {
  return raw === "on" || raw === "off" ? raw : null;
}

/** The saved choice, or `null` when there is none, it is not valid, or storage is blocked. */
export function readChoice(store: ChoiceStore | null): AnimationChoice | null {
  try {
    return parseChoice(store?.getItem(key));
  } catch {
    return null;
  }
}

/** Saves the choice. Storage can be blocked, which only means it is not remembered. */
export function saveChoice(store: ChoiceStore | null, choice: AnimationChoice): void {
  try {
    store?.setItem(key, choice);
  } catch {
    // Without storage the choice lasts until the page is reloaded.
  }
}

/** What the toggle in the taskbar offers: its state, name and whether it can be used. */
export interface ToggleView {
  readonly pressed: boolean;
  readonly disabled: boolean;
  readonly label: string;
  readonly announcement: string;
}

export const reducedMotionLabel = "Animations off: your device asks for reduced motion";

export function toggleView(inputs: AnimationInputs): ToggleView {
  if (inputs.osReducedMotion) {
    return {
      pressed: false,
      disabled: true,
      label: reducedMotionLabel,
      announcement: "Animations off",
    };
  }
  const on = effectiveAnimations(inputs) === "on";
  return {
    pressed: on,
    disabled: false,
    label: "Animations",
    announcement: on ? "Animations on" : "Animations off",
  };
}
