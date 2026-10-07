import { startClock } from "./clock-controller";
import { bindDesktopIcons } from "./desktop-icon-controller";
import { bindSectionNavigation } from "./section-navigation";
import { bindStartMenu } from "./start-menu-controller";

// The only place the browser's document and window are handed to the controllers.
bindStartMenu(document);
bindDesktopIcons(document);
bindSectionNavigation(document, window);
startClock(document, window);
