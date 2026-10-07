import { monthIndex, type Period } from "./partial-date";

export interface Sortable {
  readonly id: string;
  readonly period: Period;
}

/** An ongoing role is newer than every role that has ended. */
function endRank(period: Period): number {
  return period.end === null ? Number.POSITIVE_INFINITY : monthIndex(period.end, "end");
}

function compareNewestFirst(a: Sortable, b: Sortable): number {
  if (endRank(a.period) !== endRank(b.period)) return endRank(b.period) - endRank(a.period);
  const startA = monthIndex(a.period.start, "start");
  const startB = monthIndex(b.period.start, "start");
  if (startA !== startB) return startB - startA;
  return 0;
}

/**
 * Newest first: later end date first (an ongoing entry counts as newest), then later start date,
 * Entries with the same period keep the order of the data file (the sort is stable), so the
 * order within a role is the order written there. Overlapping entries all stay. Returns a new array.
 */
export function sortNewestFirst<T extends Sortable>(items: readonly T[]): T[] {
  return [...items].sort(compareNewestFirst);
}
