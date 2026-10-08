import { msUntilIdle, nextIdleState, startCounting, type IdleEvent } from "../idle-machine";
import {
  createMystify,
  isFrameDue,
  resizeMystify,
  stepMystify,
  type Mystify,
  type Random,
  type Shape,
} from "../mystify-step";
import type { AnimationPreference } from "./animation-controller";
import { announce } from "./status-region";

/** How far a mouse must move to count as the visitor moving it (a hint of drift does not). */
const moveThreshold = 4;

export interface ScreenSaverOptions {
  animations: AnimationPreference;
  random?: Random;
}

/**
 * The Mystify-style screen saver: two bouncing shapes with trails on a canvas that covers the page.
 * It starts after 90 seconds without activity or when asked for in the Start menu, never while
 * animations are off or the page is hidden, and the first key, pointer, touch or wheel event stops
 * it and is not passed on to the page. Colours are read from the page's tokens at the time it starts.
 */
export function bindScreenSaver(doc: Document, win: Window, options: ScreenSaverOptions): void {
  const { animations } = options;
  const random = options.random ?? Math.random;
  const now = () => win.performance.now();
  let idle = startCounting(now());
  let canvas: HTMLCanvasElement | null = null;
  let frame = 0;
  let shapes: Mystify | null = null;
  let lastDrawn: number | null = null;
  let timer: number | null = null;
  let requested = false;
  let previousFocus: HTMLElement | null = null;
  let focusAtStart: HTMLElement | null = null;
  let pointer = { x: 0, y: 0 };
  let anchor = { x: 0, y: 0 };
  let colours = { background: "", a: "", b: "" };

  const allowed = () => animations.isEnabled() && !doc.hidden;
  const root = doc.documentElement;

  const size = () => ({ width: win.innerWidth, height: win.innerHeight });

  const drawShape = (context: CanvasRenderingContext2D, shape: Shape, colour: string) => {
    context.strokeStyle = colour;
    const outlines = [...shape.trail, shape.vertices];
    for (const corners of outlines) {
      context.beginPath();
      corners.forEach((corner, index) => {
        if (index === 0) context.moveTo(corner.x, corner.y);
        else context.lineTo(corner.x, corner.y);
      });
      context.closePath();
      context.stroke();
    }
  };

  const loop = (time: number) => {
    frame = win.requestAnimationFrame(loop);
    if (canvas === null || shapes === null || !isFrameDue(lastDrawn, time)) return;
    const context = canvas.getContext("2d");
    if (context === null) return;
    shapes = stepMystify(shapes, lastDrawn === null ? 0 : time - lastDrawn);
    lastDrawn = time;
    context.fillStyle = colours.background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    drawShape(context, shapes.shapes[0], colours.a);
    drawShape(context, shapes.shapes[1], colours.b);
  };

  const onResize = () => {
    if (canvas === null || shapes === null) return;
    const { width, height } = size();
    canvas.width = width;
    canvas.height = height;
    shapes = resizeMystify(shapes, width, height);
  };

  const show = () => {
    const style = win.getComputedStyle(root);
    colours = {
      background: style.getPropertyValue("--color-screensaver-bg").trim(),
      a: style.getPropertyValue("--color-screensaver-line-a").trim(),
      b: style.getPropertyValue("--color-screensaver-line-b").trim(),
    };
    previousFocus = doc.activeElement instanceof HTMLElement ? doc.activeElement : null;
    focusAtStart = previousFocus;
    anchor = pointer;
    canvas = doc.createElement("canvas");
    canvas.className = "screensaver";
    canvas.setAttribute("aria-hidden", "true");
    // A device pixel ratio above 1 is ignored: the saver is light, not sharp.
    const { width, height } = size();
    canvas.width = width;
    canvas.height = height;
    shapes = createMystify(width, height, random);
    lastDrawn = null;
    doc.body.append(canvas);
    root.dataset["screensaver"] = "on";
    win.addEventListener("resize", onResize);
    frame = win.requestAnimationFrame(loop);
    if (requested) announce(doc, "Screen saver started");
  };

  const restoreFocus = () => {
    // If focus went somewhere else while the saver showed (a script, a screen reader), leave it there.
    const now = doc.activeElement;
    if (now !== null && now !== doc.body && now !== focusAtStart) return;
    const start = doc.getElementById("start-button");
    // An element inside the Start menu cannot take focus once the menu has closed.
    const visible =
      previousFocus?.isConnected === true &&
      previousFocus.closest("details:not([open])") === null &&
      previousFocus.getClientRects().length > 0;
    const target = visible ? previousFocus : requested ? start : null;
    if (target !== null && target !== doc.body && doc.activeElement !== target) {
      target.focus({ preventScroll: true });
    }
  };

  const hide = () => {
    win.cancelAnimationFrame(frame);
    win.removeEventListener("resize", onResize);
    canvas?.remove();
    canvas = null;
    shapes = null;
    delete root.dataset["screensaver"];
    restoreFocus();
    if (requested) announce(doc, "Screen saver stopped");
    requested = false;
  };

  const schedule = () => {
    if (timer !== null) win.clearTimeout(timer);
    timer = win.setTimeout(
      () => {
        timer = null;
        dispatch({ type: "tick", at: now(), allowed: allowed() });
        schedule();
      },
      Math.max(1000, msUntilIdle(idle, now())),
    );
  };

  const dispatch = (event: IdleEvent) => {
    const before = idle.phase;
    idle = nextIdleState(idle, event);
    if (before !== "saver" && idle.phase === "saver") show();
    else if (before === "saver" && idle.phase !== "saver") hide();
  };

  /**
   * Stops the rest of the same press from reaching the page: its key up or click, a context menu,
   * and (for a key held down) the repeats of that key. It lets go after the first of the ending
   * events (the click or the key up), or after a second, so a later key or click is never eaten.
   */
  const swallow = (types: string[], heldKey: string | null) => {
    const handler = (event: Event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      // The press ends with its click or its key up. The mouse up and the context menu come before.
      if (event.type === "click" || event.type === "keyup") release();
    };
    const repeats = (event: Event) => {
      if (event instanceof KeyboardEvent && event.repeat && event.key === heldKey) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    };
    // A new press is a new action, whether or not the old one ever ended with a click.
    const next = (event: Event) => {
      if (!(event instanceof KeyboardEvent && event.repeat)) release();
    };
    const release = () => {
      for (const type of types) doc.removeEventListener(type, handler, true);
      for (const type of ["pointerdown", "touchstart", "keydown"]) {
        doc.removeEventListener(type, next, true);
      }
      doc.removeEventListener("keydown", repeats, true);
    };
    for (const type of types) doc.addEventListener(type, handler, true);
    // Registered before the repeat guard, so a repeat is stopped while a different key lets go.
    for (const type of ["pointerdown", "touchstart", "keydown"]) {
      doc.addEventListener(type, next, true);
    }
    if (heldKey !== null) doc.addEventListener("keydown", repeats, true);
    win.setTimeout(release, 1000);
  };

  const keyTypes = ["keyup", "keypress"];
  const pressTypes = ["mouseup", "click", "touchend", "contextmenu"];

  const onActivity = (event: Event) => {
    if (event instanceof PointerEvent && event.type === "pointermove") {
      pointer = { x: event.clientX, y: event.clientY };
    }
    if (idle.phase !== "saver") {
      dispatch({ type: "activity", at: now() });
      return;
    }
    // Scrolling can come from the page itself while the saver shows (the Start menu closing, a focus
    // change), so it is not something the visitor did. Everything else stops the saver, a focus move
    // and a click made by a script or assistive technology included.
    if (event.type === "scroll") return;
    if (event.type === "pointermove") {
      const moved = Math.hypot(pointer.x - anchor.x, pointer.y - anchor.y);
      if (moved < moveThreshold) return;
    }
    // The first event only stops the saver. It does not reach what is under it.
    event.preventDefault();
    event.stopImmediatePropagation();
    if (event.type === "keydown") swallow(keyTypes, (event as KeyboardEvent).key);
    else if (event.type === "pointerdown" || event.type === "touchstart") swallow(pressTypes, null);
    dispatch({ type: "activity", at: now() });
  };

  const activityTypes = [
    "keydown",
    "pointerdown",
    "pointermove",
    "touchstart",
    "wheel",
    "focusin",
    "click",
  ];
  for (const type of activityTypes) {
    doc.addEventListener(type, onActivity, { capture: true, passive: false });
  }
  // Scrolling inside a window does not bubble, so it is caught on the way down.
  doc.addEventListener("scroll", onActivity, { capture: true, passive: true });

  doc.addEventListener("click", (event) => {
    if ((event.target as Element).closest("[data-screensaver-start]") === null) return;
    requested = true;
    dispatch({ type: "request", at: now(), allowed: allowed() });
    if (idle.phase !== "saver") requested = false;
  });

  doc.addEventListener("visibilitychange", () => {
    dispatch(doc.hidden ? { type: "hidden", at: now() } : { type: "visible", at: now() });
  });
  // Turning animations off stops a running saver at once.
  animations.onChange(() => dispatch({ type: "tick", at: now(), allowed: allowed() }));

  schedule();
}
