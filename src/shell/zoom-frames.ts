/** A rectangle in viewport pixels. */
export interface Rect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/** About eight frames in a quarter of a second: discrete steps, as NT 3.1 drew them. */
export const zoomSteps = 8;
export const zoomDurationMs = 250;

/** True when a rectangle has an area, so an outline between two of them can be drawn. */
export function isDrawable(rect: Rect): boolean {
  return (
    [rect.x, rect.y, rect.width, rect.height].every(Number.isFinite) &&
    rect.width > 0 &&
    rect.height > 0
  );
}

/**
 * The rectangles of a zoom outline, from `from` to `to`, in whole pixels. There are `steps + 1`
 * of them: the first is `from` and the last is `to`, and those between are evenly spaced.
 */
export function zoomFrames(from: Rect, to: Rect, steps: number = zoomSteps): Rect[] {
  const count = Number.isFinite(steps) ? Math.max(1, Math.floor(steps)) : zoomSteps;
  const frames: Rect[] = [];
  for (let step = 0; step <= count; step++) {
    const t = step / count;
    const mix = (a: number, b: number) => Math.round(a + (b - a) * t);
    frames.push({
      x: mix(from.x, to.x),
      y: mix(from.y, to.y),
      width: mix(from.width, to.width),
      height: mix(from.height, to.height),
    });
  }
  return frames;
}

/** The numbers of a rectangle as text, for the overlay's `data-from` and `data-to`. */
export function rectText(rect: Rect): string {
  return [rect.x, rect.y, rect.width, rect.height].map((value) => Math.round(value)).join(" ");
}
