import { homePath } from "../section-model";
import type { WindowEvent, WindowModel } from "../window-state";
import type { Rect } from "../zoom-frames";
import { playZoom, type Animator } from "./zoom-animator";
import type { NavigationObserver, SectionNavigation } from "./section-navigation";

/** The pure rules, handed in so this controller only has to apply them to the page. */
export interface WindowMachine {
  initial: WindowModel;
  next(model: WindowModel, event: WindowEvent): WindowModel;
  announcement(from: WindowModel["state"], to: WindowModel["state"], title: string): string | null;
  maximizeAnnouncement(maximized: boolean, title: string): string;
}

/** A window controller follows the navigation, and is told which navigation to use once it exists. */
export interface WindowControls extends NavigationObserver {
  bind(navigation: SectionNavigation): void;
}

/** Wider than this, a window can be maximized. Narrower, it already fills the desktop. */
const wideQuery = "(min-width: 40rem)";
/** Shorter than this, a maximized window is fixed over the whole page, the status bar included. */
const shortQuery = "(max-height: 30rem)";

/**
 * Drives the title bar controls and the window's taskbar button. The state itself comes from the
 * pure machine. This part only reads the page, hides or shows the window, moves focus and speaks.
 * The state is never stored: a page that loads with a browser window starts open and normal size.
 * Every change also asks the animator for a zoom outline between where the window was and where it
 * goes. That is decorative: it is requested after the change has been made, and nothing waits on it.
 */
export function createWindowControls(
  doc: Document,
  win: Window,
  machine: WindowMachine,
  animator: Animator,
): WindowControls {
  let navigation: SectionNavigation | null = null;
  let model: WindowModel =
    doc.getElementById("browser") === null
      ? machine.initial
      : {
          state: "open",
          maximized: false,
        };
  let savedScroll = { top: 0, left: 0 };
  const wide = win.matchMedia(wideQuery);
  const short = win.matchMedia(shortQuery);

  const browser = () => doc.getElementById("browser");
  const client = () => browser()?.querySelector<HTMLElement>("[data-scroll-client]") ?? null;
  const taskButton = () => doc.querySelector<HTMLButtonElement>("[data-task-window]");
  const maximizeButton = () =>
    browser()?.querySelector<HTMLButtonElement>('[data-window-action="maximize"]') ?? null;
  const titleOf = () => taskButton()?.textContent?.trim() ?? "";
  let title = titleOf();
  /** The path of the section in the window, so a closing window can zoom to its folder. */
  let sectionPath = doc.getElementById("browser") === null ? "" : win.location.pathname;
  /** Where the click that opens a window came from, and where a closing window was. */
  let origin: Rect | null = null;
  let closingFrom: Rect | null = null;
  /** The origin of the load that is running, which only a click can give. */
  let loadOrigin: Rect | null = null;

  const enabled = () => {
    try {
      return animator.isEnabled();
    } catch {
      return false;
    }
  };
  /** The rectangle of an element, or null when there is none. Read before anything is changed. */
  const rectOf = (element: Element | null): Rect | null => {
    if (element === null || !enabled()) return null;
    const { x, y, width, height } = element.getBoundingClientRect();
    return { x, y, width, height };
  };
  const play = (from: Rect | null, to: Rect | null) => {
    if (from !== null && to !== null) playZoom(animator, from, to);
  };
  const startButton = () => doc.getElementById("start-button");
  const folderFor = (path: string) =>
    [...doc.querySelectorAll<HTMLAnchorElement>("[data-desktop-icon]")].find(
      (icon) => new URL(icon.href).pathname === path,
    ) ?? null;

  const say = (message: string | null) => {
    const status = doc.querySelector("[data-page-status]");
    if (status !== null && message !== null) status.textContent = message;
  };

  /** Makes the page show the model: hidden or not, maximized or not, the buttons in step. */
  const render = () => {
    const window = browser();
    if (window !== null) {
      window.hidden = model.state === "minimized";
      if (model.maximized) window.dataset["maximized"] = "true";
      else delete window.dataset["maximized"];
    }
    taskButton()?.setAttribute("aria-pressed", String(model.state !== "minimized"));
    const button = maximizeButton();
    if (button !== null) {
      button.setAttribute("aria-label", model.maximized ? "Restore" : "Maximize");
      button.dataset["mode"] = model.maximized ? "restore" : "maximize";
    }
    // A maximized window covers the desktop folders, and on a short screen the status bar too,
    // so keyboard and assistive technology skip them.
    const covering = model.state === "open" && model.maximized && wide.matches;
    const folders = doc.querySelector<HTMLElement>('nav[aria-label="Desktop folders"]');
    if (folders !== null) folders.inert = covering;
    const footer = doc.querySelector<HTMLElement>("body > footer");
    if (footer !== null) footer.inert = covering && short.matches;
  };
  wide.addEventListener("change", render);
  short.addEventListener("change", render);

  /** Applies an event to the model and the page. Returns the model that was left. */
  const apply = (event: WindowEvent, speak: boolean): WindowModel => {
    const from = model;
    if (from.state === "open") title = titleOf() || title;
    // A hidden window loses where it was scrolled to, so that is kept.
    const leaving = event.type === "minimize" || event.type === "toggle";
    const area = client();
    if (from.state === "open" && leaving && area !== null) {
      savedScroll = { top: area.scrollTop, left: area.scrollLeft };
    }
    model = machine.next(from, event);
    render();
    if (speak) say(machine.announcement(from.state, model.state, title));
    return from;
  };

  const showWindowAgain = () => {
    const area = client();
    if (area !== null) {
      area.scrollTop = savedScroll.top;
      area.scrollLeft = savedScroll.left;
    }
    doc.getElementById("main")?.focus({ preventScroll: true });
  };

  /** Minimizes or restores, and puts focus where a person using it expects it. */
  const change = (event: WindowEvent) => {
    const before = { window: rectOf(browser()), task: rectOf(taskButton()) };
    const from = apply(event, true);
    if (from.state === model.state) return;
    if (model.state === "minimized") {
      taskButton()?.focus();
      play(before.window, before.task);
    } else if (from.state === "minimized") {
      showWindowAgain();
      play(before.task, rectOf(browser()));
    }
  };

  /** Maximizes or puts the window back to its normal size. Focus stays where it was. */
  const toggleMaximize = (focusButton: boolean) => {
    // Until the script has finished binding, its controls are not on offer, and nor is this.
    if (!doc.documentElement.classList.contains("js") || !wide.matches) return;
    const before = rectOf(browser());
    const from = apply({ type: "toggle-maximize" }, false);
    if (from.maximized === model.maximized) return;
    // The change, what is said and where focus is all come first. The outline is only decoration.
    say(machine.maximizeAnnouncement(model.maximized, title));
    if (focusButton) maximizeButton()?.focus();
    play(before, rectOf(browser()));
  };

  const close = () => {
    const section = win.location.pathname;
    if (navigation === null) {
      win.location.assign(homePath);
      return;
    }
    // A page that cannot be swapped in is loaded normally by the navigation itself.
    void navigation.open(homePath).then((shown) => {
      if (!shown) return;
      (folderFor(section) ?? doc.getElementById("main"))?.focus();
    });
  };

  // Remembers what was clicked to open a window, before the Start menu closes or the page changes.
  doc.addEventListener(
    "click",
    (event) => {
      const opener = (event.target as Element).closest(
        "[data-desktop-icon], .start-item:not([data-screensaver-start])",
      );
      origin = rectOf(opener);
    },
    true,
  );
  // A click that opens a window has started its load by the time the event reaches the window. One
  // that has not (the folder of the page that is open, a button) must not leave an origin for later.
  win.addEventListener("click", () => {
    origin = null;
  });

  doc.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    const target = event.target as Element;
    const action = target.closest<HTMLElement>("[data-window-action]")?.dataset["windowAction"];
    if (action === "minimize") change({ type: "minimize" });
    else if (action === "maximize") toggleMaximize(true);
    else if (action === "close") close();
    else if (target.closest("[data-task-window]")) change({ type: "toggle" });
    // The skip link points into the window, so a minimized window comes back for it.
    else if (model.state === "minimized" && target.closest<HTMLAnchorElement>('a[href="#main"]')) {
      apply({ type: "restore" }, true);
    }
  });

  // A double click on the title bar, but not on one of its buttons, does what Maximize does.
  doc.addEventListener("dblclick", (event) => {
    const target = event.target as Element;
    if (target.closest("#browser .titlebar") === null || target.closest(".control") !== null) {
      return;
    }
    toggleMaximize(false);
  });

  return {
    bind(next) {
      navigation = next;
    },
    navigating(path) {
      loadOrigin = origin;
      origin = null;
      closingFrom = path === homePath && model.state === "open" ? rectOf(browser()) : null;
    },
    navigated(path, swapped) {
      const target = path === homePath ? "desktop" : "section";
      const opener = loadOrigin;
      loadOrigin = null;
      const closing = closingFrom;
      closingFrom = null;
      const from = apply({ type: "navigate", target }, !swapped || target === "desktop");
      if (target === "section") {
        title = titleOf();
        sectionPath = path;
      }
      // A different page already announced itself and holds focus.
      if (!swapped && from.state === "minimized") showWindowAgain();
      if (enabled()) {
        if (target === "desktop") {
          if (from.state === "open") play(closing, rectOf(folderFor(sectionPath) ?? startButton()));
          sectionPath = "";
        } else if (from.state !== "open") {
          // A window opens from what was clicked, or restores from its taskbar button.
          const fromTask = from.state === "minimized" || opener === null;
          play(fromTask ? rectOf(taskButton()) : opener, rectOf(browser()));
        }
      }
    },
  };
}
