import { describe, expect, it } from "vitest";
import { createZoomAnimator, playZoom, type Animator } from "./zoom-animator";

const from = { x: 0, y: 0, width: 40, height: 40 };
const to = { x: 100, y: 100, width: 400, height: 300 };

/** The few parts of a document that the animator touches, with a spy on each. */
function fakeDocument(animate: () => unknown) {
  const calls = { created: 0, appended: 0, removed: 0 };
  const element = {
    className: "",
    style: {} as Record<string, string>,
    dataset: {} as Record<string, string>,
    setAttribute: () => undefined,
    animate,
    remove: () => void calls.removed++,
  };
  const doc = {
    createElement: () => {
      calls.created++;
      return element;
    },
    body: { append: () => void calls.appended++ },
    documentElement: { dataset: {} as Record<string, string> },
  };
  return { doc: doc as unknown as Document, calls, root: doc.documentElement };
}

const finishedAnimation = () => ({ finished: Promise.resolve(), cancel: () => undefined });

describe("createZoomAnimator", () => {
  it("draws nothing at all when it is not enabled", async () => {
    const { doc, calls } = fakeDocument(finishedAnimation);
    const animator = createZoomAnimator(doc, () => false);
    await animator.zoom(from, to);
    expect(calls).toEqual({ created: 0, appended: 0, removed: 0 });
  });

  it("draws nothing between rectangles that have no area", async () => {
    const { doc, calls } = fakeDocument(finishedAnimation);
    const animator = createZoomAnimator(doc, () => true);
    await animator.zoom({ ...from, width: 0 }, to);
    expect(calls.created).toBe(0);
  });

  it("puts an outline on the page while it runs and takes it away afterwards", async () => {
    const { doc, calls, root } = fakeDocument(finishedAnimation);
    const animator = createZoomAnimator(doc, () => true);
    await animator.zoom(from, to);
    expect(calls.appended).toBe(1);
    expect(calls.removed).toBe(1);
    expect(root.dataset["animating"]).toBeUndefined();
  });

  it("leaves nothing behind and does not throw when the browser refuses to animate", async () => {
    const { doc, calls, root } = fakeDocument(() => {
      throw new DOMException("no", "NotSupportedError");
    });
    const animator = createZoomAnimator(doc, () => true);
    await expect(animator.zoom(from, to)).resolves.toBeUndefined();
    expect(calls.removed).toBe(1);
    expect(root.dataset["animating"]).toBeUndefined();
  });

  it("does not reject when the animation is cancelled", async () => {
    const { doc, root } = fakeDocument(() => ({
      finished: Promise.reject(new DOMException("cancelled", "AbortError")),
      cancel: () => undefined,
    }));
    await expect(createZoomAnimator(doc, () => true).zoom(from, to)).resolves.toBeUndefined();
    expect(root.dataset["animating"]).toBeUndefined();
  });
});

describe("playZoom", () => {
  const throwing: Animator = {
    isEnabled: () => true,
    zoom: () => {
      throw new Error("broken");
    },
  };
  const rejecting: Animator = {
    isEnabled: () => true,
    zoom: () => Promise.reject(new Error("broken")),
  };

  it("never throws, whether the animator throws or rejects", async () => {
    expect(() => playZoom(throwing, from, to)).not.toThrow();
    expect(() => playZoom(rejecting, from, to)).not.toThrow();
    // A rejection that nobody handles would fail the run, so give it a turn to surface.
    await Promise.resolve();
  });

  it("passes the rectangles to a working animator", () => {
    const seen: unknown[] = [];
    playZoom(
      { isEnabled: () => true, zoom: (a, b) => (seen.push(a, b), Promise.resolve()) },
      from,
      to,
    );
    expect(seen).toEqual([from, to]);
  });
});
