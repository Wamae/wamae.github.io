import { formatClockTime, millisecondsToNextMinute } from "../clock-time";

/** Fills the taskbar clock and updates it once a minute. No animation, text only. */
export function startClock(doc: Document, win: Window): void {
  const clock = doc.querySelector<HTMLTimeElement>("[data-clock]");
  if (clock === null) return;
  const tick = () => {
    const now = new Date();
    clock.textContent = formatClockTime(now);
    clock.dateTime = formatClockTime(now);
    win.setTimeout(tick, millisecondsToNextMinute(now));
  };
  tick();
}
