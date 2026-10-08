import { isDrawable, rectText, zoomDurationMs, zoomFrames, type Rect } from "../zoom-frames";

/**
 * Draws a zoom outline between two rectangles. It is decorative: nothing waits for it, it takes no
 * focus, and the page works the same when it does nothing. An animator that is not enabled ignores
 * every request.
 */
export interface Animator {
  isEnabled(): boolean;
  zoom(from: Rect, to: Rect): Promise<void>;
}

/**
 * Asks an animator for an outline without ever letting it get in the way. An animator that throws,
 * or whose promise is rejected, is ignored: the outline is decoration, and the window change that
 * asked for it has been made already.
 */
export function playZoom(animator: Animator, from: Rect, to: Rect): void {
  try {
    void Promise.resolve(animator.zoom(from, to)).catch(() => undefined);
  } catch {
    // A failing animation is not a failing window.
  }
}

/** An animator that never draws, for the cases where there is nothing to animate with. */
export const noAnimator: Animator = {
  isEnabled: () => false,
  zoom: () => Promise.resolve(),
};

/**
 * The real animator. One overlay element at a time: a new outline cancels the one that is running,
 * and the element is removed when it ends. `data-animating` is on the page while one runs.
 */
export function createZoomAnimator(doc: Document, isEnabled: () => boolean): Animator {
  let running: { element: HTMLElement; animation: Animation } | null = null;

  const stop = () => {
    if (running === null) return;
    const { element, animation } = running;
    running = null;
    animation.cancel();
    element.remove();
    delete doc.documentElement.dataset["animating"];
  };

  const draw = (from: Rect, to: Rect): Promise<void> => {
    stop();
    if (!isEnabled() || !isDrawable(from) || !isDrawable(to)) return Promise.resolve();
    const element = doc.createElement("div");
    if (typeof element.animate !== "function") return Promise.resolve();
    const frames = zoomFrames(from, to);
    element.className = "zoom-outline";
    element.setAttribute("aria-hidden", "true");
    element.dataset["from"] = rectText(from);
    element.dataset["to"] = rectText(to);
    Object.assign(element.style, {
      left: `${from.x}px`,
      top: `${from.y}px`,
      width: `${from.width}px`,
      height: `${from.height}px`,
    });
    doc.body.append(element);
    doc.documentElement.dataset["animating"] = "zoom";
    // Each keyframe holds until the next one, so the outline jumps between steps.
    let animation: Animation;
    try {
      animation = element.animate(
        frames.map((frame) => ({
          left: `${frame.x}px`,
          top: `${frame.y}px`,
          width: `${frame.width}px`,
          height: `${frame.height}px`,
          easing: "step-end",
        })),
        { duration: zoomDurationMs },
      );
    } catch {
      // The browser refused to animate: take the outline away again and carry on without it.
      element.remove();
      delete doc.documentElement.dataset["animating"];
      return Promise.resolve();
    }
    const mine = { element, animation };
    running = mine;
    const done = () => {
      if (running === mine) stop();
    };
    return animation.finished.then(done, done);
  };

  return {
    isEnabled,
    zoom(from, to) {
      try {
        return draw(from, to);
      } catch {
        // If the browser cannot animate, the outline is dropped and nothing is left behind.
        stop();
        return Promise.resolve();
      }
    },
  };
}
