import {
  afterOpeningPage,
  afterTraversal,
  canGoBack,
  canGoForward,
  readPosition,
  restorePosition,
  writePosition,
  type HistoryPosition,
} from "../history-position";
import { fragmentId } from "../fragment-id";
import { readSavedLength, saveLength } from "../history-length-storage";
import { resolveInternalRoute } from "../internal-route";
import { routePaths } from "../section-model";

/** The parts of the page that change when another section opens. */
const swapRegions = ["stage", "task-windows"] as const;

const styleSelector = "style, link[rel=stylesheet]";

/** How a page load ended. A superseded load was overtaken by a newer one and must change nothing. */
type Outcome = "shown" | "superseded" | "failed";

function styleKey(node: Element): string {
  return node instanceof HTMLLinkElement
    ? `link:${node.getAttribute("href")}`
    : `style:${node.textContent}`;
}

/**
 * Astro puts a page's component styles in that page's own head. A page opened by a swap may need
 * styles the first page did not load, so any style the new page has and this one lacks is added.
 */
async function adoptStyles(doc: Document, next: Document): Promise<void> {
  const known = new Set([...doc.head.querySelectorAll(styleSelector)].map(styleKey));
  const loading: Promise<void>[] = [];
  for (const node of next.head.querySelectorAll(styleSelector)) {
    if (known.has(styleKey(node))) continue;
    known.add(styleKey(node));
    const copy = doc.importNode(node, true);
    if (copy instanceof HTMLLinkElement) {
      loading.push(
        new Promise((resolve) => {
          copy.onload = copy.onerror = () => resolve();
        }),
      );
    }
    doc.head.append(copy);
  }
  await Promise.all(loading);
}

/**
 * Opens sections inside the browser window without a full page load: it fetches the static page,
 * swaps the changed regions, and keeps the address bar, title and history in step.
 * Any failure falls back to a normal page load, so the real pages always work.
 */
export function bindSectionNavigation(doc: Document, win: Window): void {
  let currentPath = resolveInternalRoute(win.location.href, win.location.href, routePaths);
  if (currentPath === null) return;
  const store = (() => {
    try {
      return win.sessionStorage;
    } catch {
      return null;
    }
  })();
  let position: HistoryPosition = restorePosition(
    readPosition(win.history.state),
    readSavedLength(store),
    win.history.length,
  );
  win.history.replaceState(writePosition(position), "");
  saveLength(store, position.length);

  let pendingPath: string | null = null;
  let pendingRequest: AbortController | null = null;
  let latestRequest = 0;

  const syncToolbar = () => {
    const back = doc.querySelector<HTMLButtonElement>("#browser-back");
    const forward = doc.querySelector<HTMLButtonElement>("#browser-forward");
    if (back) back.disabled = !canGoBack(position);
    if (forward) forward.disabled = !canGoForward(position);
    saveLength(store, position.length);
  };

  const cancelPending = () => {
    latestRequest++;
    pendingRequest?.abort();
    pendingRequest = null;
    pendingPath = null;
  };

  /** Fetches a page and swaps it in. Only the newest load ever changes the page. */
  const load = async (path: string): Promise<Outcome> => {
    cancelPending();
    const request = latestRequest;
    const abort = new AbortController();
    pendingRequest = abort;
    pendingPath = path;
    const finish = (outcome: Outcome): Outcome => {
      if (request === latestRequest) {
        pendingRequest = null;
        pendingPath = null;
      }
      return outcome;
    };
    try {
      const response = await fetch(path, { signal: abort.signal });
      if (!response.ok) return finish("failed");
      const next = new DOMParser().parseFromString(await response.text(), "text/html");
      if (request !== latestRequest) return "superseded";
      const replacements = swapRegions.map((name) => ({
        current: doc.querySelector(`[data-swap="${name}"]`),
        next: next.querySelector(`[data-swap="${name}"]`),
      }));
      if (replacements.some((pair) => pair.current === null || pair.next === null)) {
        return finish("failed");
      }
      await adoptStyles(doc, next);
      if (request !== latestRequest) return "superseded";
      for (const pair of replacements) pair.current?.replaceWith(pair.next as Element);
      doc.title = next.title;
      // A hidden status region tells screen reader users that the page changed.
      const status = doc.querySelector("[data-page-status]");
      if (status !== null) status.textContent = next.title;
      currentPath = path;
      return finish("shown");
    } catch {
      return request === latestRequest ? finish("failed") : "superseded";
    }
  };

  const focusAfterSwap = (previousId: string) => {
    const same = previousId === "" ? null : doc.getElementById(previousId);
    if (same instanceof HTMLElement && !(same as HTMLButtonElement).disabled) same.focus();
    else doc.getElementById("main")?.focus();
  };

  /** Moves focus to the place a fragment points at, or to the page when there is none. */
  const focusPlace = (hash: string) => {
    const id = fragmentId(hash);
    const place = id === "" ? null : doc.getElementById(id);
    if (place === null) {
      doc.getElementById("main")?.focus();
      return;
    }
    // A plain element can take focus from a script once it has a tabindex.
    if (place.tabIndex < 0 && !place.hasAttribute("tabindex")) place.tabIndex = -1;
    place.focus();
    place.scrollIntoView();
  };

  doc.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target as Element;
    const back = target.closest("#browser-back");
    const forward = target.closest("#browser-forward");
    if (back || forward) {
      event.preventDefault();
      if (back) win.history.back();
      else win.history.forward();
      return;
    }
    const link = target.closest("a");
    if (
      link === null ||
      (link.target !== "" && link.target !== "_self") ||
      link.hasAttribute("download")
    ) {
      return;
    }
    // A link to a place on this very page, such as the skip link, is left to the browser.
    // It still adds a history entry, so the position is advanced and stored for it.
    if (link.hash !== "" && link.pathname === win.location.pathname) {
      if (link.hash !== win.location.hash) {
        position = afterOpeningPage(position);
        win.setTimeout(() => {
          win.history.replaceState(writePosition(position), "");
          syncToolbar();
        }, 0);
      }
      return;
    }
    const path = resolveInternalRoute(link.href, win.location.href, routePaths);
    if (path === null) return;
    event.preventDefault();
    if (path === pendingPath) return;
    if (path === currentPath) {
      // A Back or Forward that is still loading has already moved the browser URL elsewhere.
      // The page on screen is the one chosen, so it is opened as a new entry in that place.
      const urlPath = resolveInternalRoute(win.location.href, win.location.href, routePaths);
      cancelPending();
      if (urlPath !== currentPath) {
        position = afterOpeningPage(position);
        win.history.pushState(writePosition(position), "", path);
        syncToolbar();
      }
      doc.getElementById("main")?.focus();
      return;
    }
    void load(path).then((outcome) => {
      if (outcome === "superseded") return;
      if (outcome === "failed") {
        win.location.assign(link.href);
        return;
      }
      position = afterOpeningPage(position);
      win.history.pushState(writePosition(position), "", `${path}${link.hash}`);
      syncToolbar();
      focusPlace(link.hash);
    });
  });

  win.addEventListener("popstate", (event) => {
    const stored = readPosition(event.state);
    if (stored !== null) position = afterTraversal(position, stored);
    const path = resolveInternalRoute(win.location.href, win.location.href, routePaths);
    if (path === null) {
      win.location.reload();
      return;
    }
    if (path === currentPath) {
      cancelPending();
      syncToolbar();
      return;
    }
    const previousId = doc.activeElement?.id ?? "";
    void load(path).then((outcome) => {
      if (outcome === "superseded") return;
      if (outcome === "failed") {
        win.location.reload();
        return;
      }
      syncToolbar();
      focusAfterSwap(previousId);
      // Going Back to an entry with a fragment shows that place, as a normal page would.
      doc.getElementById(fragmentId(win.location.hash))?.scrollIntoView();
    });
  });

  syncToolbar();
}
