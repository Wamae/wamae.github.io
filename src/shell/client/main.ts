import { bindAnimationPreference } from "./animation-controller";
import { createBusyIndicator } from "./busy-controller";
import { startClock } from "./clock-controller";
import { bindDesktopIcons } from "./desktop-icon-controller";
import { bindSectionNavigation } from "./section-navigation";
import { bindStartMenu } from "./start-menu-controller";
import { createWindowControls } from "./window-controller";
import { maximizeAnnouncement, nextWindow, noWindow, windowAnnouncement } from "../window-state";

/** Local storage, or nothing when the browser blocks it. */
function localStore(win: Window): Storage | null {
  try {
    return win.localStorage;
  } catch {
    return null;
  }
}

// The only place the browser's document and window are handed to the controllers,
// and the only place the controllers are joined to each other.
const animations = bindAnimationPreference(document, window, localStore(window));
bindStartMenu(document);
bindDesktopIcons(document);
const windowControls = createWindowControls(document, window, {
  initial: noWindow,
  next: nextWindow,
  announcement: windowAnnouncement,
  maximizeAnnouncement,
});
const busy = createBusyIndicator(document, window, animations.isEnabled);
windowControls.bind(bindSectionNavigation(document, window, windowControls, busy));
startClock(document, window);

// Last, so that script-only controls appear only when everything above has been bound. If any
// bind throws, the plain fallbacks (the Close link, the taskbar link) stay and nothing is dead.
document.documentElement.classList.add("js");
