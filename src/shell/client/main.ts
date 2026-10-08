import { startClock } from "./clock-controller";
import { bindDesktopIcons } from "./desktop-icon-controller";
import { bindSectionNavigation } from "./section-navigation";
import { bindStartMenu } from "./start-menu-controller";
import { createWindowControls } from "./window-controller";
import { maximizeAnnouncement, nextWindow, noWindow, windowAnnouncement } from "../window-state";

// The only place the browser's document and window are handed to the controllers,
// and the only place the controllers are joined to each other.
bindStartMenu(document);
bindDesktopIcons(document);
const windowControls = createWindowControls(document, window, {
  initial: noWindow,
  next: nextWindow,
  announcement: windowAnnouncement,
  maximizeAnnouncement,
});
windowControls.bind(bindSectionNavigation(document, window, windowControls));
startClock(document, window);

// Last, so that script-only controls appear only when everything above has been bound. If any
// bind throws, the plain fallbacks (the Close link, the taskbar link) stay and nothing is dead.
document.documentElement.classList.add("js");
