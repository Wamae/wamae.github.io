import type { AnimationPreference } from "./animation-controller";
import type { NavigationObserver } from "./section-navigation";

/**
 * Starts the Program Manager cascade when that page is swapped into the browser window with
 * animations on, by marking its group windows. The CSS does the rest. A mark is taken off when its
 * animation ends or is cancelled, so switching animations on later never plays it again.
 */
export function bindCascade(doc: Document, animations: AnimationPreference): NavigationObserver {
  const clear = (event: Event) => {
    if (event.target instanceof HTMLElement) event.target.removeAttribute("data-cascade");
  };
  doc.addEventListener("animationend", clear);
  doc.addEventListener("animationcancel", clear);
  return {
    navigating: () => undefined,
    navigated(_path, swapped) {
      if (!swapped || !animations.isEnabled()) return;
      for (const group of doc.querySelectorAll<HTMLElement>("#program-manager .group")) {
        group.setAttribute("data-cascade", "");
      }
    },
  };
}
