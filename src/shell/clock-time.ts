/** The taskbar clock text, as hours and minutes on a 24-hour clock, for example `09:05`. */
export function formatClockTime(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Milliseconds until the next minute starts, so the clock changes only when it must. */
export function millisecondsToNextMinute(date: Date): number {
  return 60_000 - (date.getSeconds() * 1000 + date.getMilliseconds());
}
