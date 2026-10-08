/** How long the busy cursor lasts at least, so a fast load still shows it (charter: a short simulated load). */
export const minimumBusyMs = 300;

/**
 * How much longer the busy cursor must stay once loading has ended. With animations off the
 * cursor shows only while something is really loading. The page content never waits for this.
 */
export function remainingBusyMs(
  startedAt: number,
  now: number,
  animationsOn: boolean,
  minimum: number = minimumBusyMs,
): number {
  if (!animationsOn) return 0;
  // A clock that went back must not make the cursor last longer than the minimum.
  return Math.min(minimum, Math.max(0, minimum - (now - startedAt)));
}
