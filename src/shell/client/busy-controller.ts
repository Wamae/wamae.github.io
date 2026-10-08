import { remainingBusyMs } from "../busy-state";

/** Told when a page starts loading and when it has finished, however it ended. */
export interface BusyIndicator {
  begin(): void;
  end(): void;
}

/** A busy indicator that does nothing, for pages and tests that have no cursor to show. */
export const noBusyIndicator: BusyIndicator = { begin: () => undefined, end: () => undefined };

/**
 * Shows the hourglass cursor (`data-busy` on the page, `aria-busy` on the swapped regions) while
 * pages load. With animations on, a fast load still keeps the cursor for a short minimum, so the
 * busy state can be seen. That only extends the cursor: the page itself is never held back.
 */
export function createBusyIndicator(
  doc: Document,
  win: Window,
  animationsOn: () => boolean,
  now: () => number = () => win.performance.now(),
): BusyIndicator {
  let loading = 0;
  let startedAt = 0;
  let timer: number | null = null;

  const show = (busy: boolean) => {
    if (busy) doc.documentElement.dataset["busy"] = "true";
    else delete doc.documentElement.dataset["busy"];
    for (const region of doc.querySelectorAll("[data-swap]")) {
      if (busy) region.setAttribute("aria-busy", "true");
      else region.removeAttribute("aria-busy");
    }
  };

  return {
    begin() {
      loading++;
      if (timer !== null) {
        win.clearTimeout(timer);
        timer = null;
      }
      if (loading === 1) startedAt = now();
      show(true);
    },
    end() {
      loading = Math.max(0, loading - 1);
      if (loading > 0) return;
      const wait = remainingBusyMs(startedAt, now(), animationsOn());
      if (wait <= 0) {
        show(false);
        return;
      }
      timer = win.setTimeout(() => {
        timer = null;
        show(false);
      }, wait);
    },
  };
}
