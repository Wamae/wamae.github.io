/** Ninety seconds without any activity starts the screen saver. */
export const idleTimeoutMs = 90_000;

/** counting: waiting for the visitor to be idle. saver: showing. dismissed: just stopped. */
export type IdlePhase = "counting" | "saver" | "dismissed";

export interface IdleState {
  readonly phase: IdlePhase;
  /** When the visitor last did something (or when counting started). */
  readonly lastActivityAt: number;
}

export type IdleEvent =
  /** A key, pointer, touch, scroll or focus event. */
  | { readonly type: "activity"; readonly at: number }
  /** The timer fired. `allowed` is false when animations are off or the page is hidden. */
  | { readonly type: "tick"; readonly at: number; readonly allowed: boolean }
  /** The visitor asked for the saver, from the Start menu. */
  | { readonly type: "request"; readonly at: number; readonly allowed: boolean }
  | { readonly type: "hidden"; readonly at: number }
  | { readonly type: "visible"; readonly at: number };

export const startCounting = (at: number): IdleState => ({ phase: "counting", lastActivityAt: at });

/**
 * The idle rules, with time passed in so nothing here reads a clock. The saver never starts
 * while it is not `allowed`, and it stops as soon as it stops being allowed or the page is hidden.
 */
export function nextIdleState(
  state: IdleState,
  event: IdleEvent,
  timeoutMs: number = idleTimeoutMs,
): IdleState {
  if (state.phase === "saver") {
    switch (event.type) {
      case "activity":
        return { phase: "dismissed", lastActivityAt: event.at };
      case "hidden":
        return { phase: "dismissed", lastActivityAt: event.at };
      case "tick":
        return event.allowed ? state : { phase: "dismissed", lastActivityAt: event.at };
      default:
        return state;
    }
  }
  // Counting, or dismissed, which counts again from whatever happens next.
  switch (event.type) {
    case "activity":
    case "visible":
      return startCounting(event.at);
    case "hidden":
      return state.phase === "dismissed" ? startCounting(event.at) : state;
    case "request":
      return event.allowed ? { phase: "saver", lastActivityAt: event.at } : state;
    case "tick": {
      // Time spent where the saver may not run does not count towards the timeout.
      if (!event.allowed || state.phase === "dismissed") return startCounting(event.at);
      return event.at - state.lastActivityAt >= timeoutMs
        ? { phase: "saver", lastActivityAt: state.lastActivityAt }
        : state;
    }
  }
}

/** How long until the next check is due, never negative. */
export function msUntilIdle(
  state: IdleState,
  now: number,
  timeoutMs: number = idleTimeoutMs,
): number {
  return Math.max(0, state.lastActivityAt + timeoutMs - now);
}
