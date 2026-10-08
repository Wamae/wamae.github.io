import { homePath } from "../section-model";
import type { WindowEvent, WindowModel } from "../window-state";
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
 */
export function createWindowControls(
  doc: Document,
  win: Window,
  machine: WindowMachine,
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
    const from = apply(event, true);
    if (from.state === model.state) return;
    if (model.state === "minimized") taskButton()?.focus();
    else if (from.state === "minimized") showWindowAgain();
  };

  /** Maximizes or puts the window back to its normal size. Focus stays where it was. */
  const toggleMaximize = (focusButton: boolean) => {
    // Until the script has finished binding, its controls are not on offer, and nor is this.
    if (!doc.documentElement.classList.contains("js") || !wide.matches) return;
    const from = apply({ type: "toggle-maximize" }, false);
    if (from.maximized === model.maximized) return;
    say(machine.maximizeAnnouncement(model.maximized, title));
    if (focusButton) maximizeButton()?.focus();
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
      const icon = [...doc.querySelectorAll<HTMLAnchorElement>("[data-desktop-icon]")].find(
        (candidate) => new URL(candidate.href).pathname === section,
      );
      (icon ?? doc.getElementById("main"))?.focus();
    });
  };

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
    navigated(path, swapped) {
      const target = path === homePath ? "desktop" : "section";
      const from = apply({ type: "navigate", target }, !swapped || target === "desktop");
      if (target === "section") title = titleOf();
      // A different page already announced itself and holds focus.
      if (!swapped && from.state === "minimized") showWindowAgain();
    },
  };
}
