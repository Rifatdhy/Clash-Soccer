/**
 * Layout maths for the public schedule page.
 *
 * Everything here is a pure function over plain data: no database client, no
 * React, no `next/*`, no imports at all. The schedule page groups fixtures by
 * month, labels those groups, and shows how many places are left in each one;
 * doing that inside a server component would mean every rule could only be
 * checked by starting a database and rendering a page. Keeping the maths here
 * lets `node --test` pin the behaviour directly, including the edge cases that
 * used to break the page — an empty schedule, a match with no places left, and
 * a fixture list shared through a cache that must never be mutated in place.
 */

const MONTH_NAMES = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Turn a `YYYY-MM-DD` date into a `YYYY-MM` grouping key.
 *
 * Slicing the string instead of going through `Date` keeps the key stable: a
 * `Date` built from a date-only string is parsed as UTC, so any local timezone
 * west of Greenwich would shift the first day of a month into the previous one.
 */
export function monthKey(date: string): string {
  return date.slice(0, 7);
}

/**
 * Human label for the month of a `YYYY-MM-DD` date, e.g. `"November 2026"`.
 *
 * The names are written out rather than taken from `toLocaleDateString` so the
 * output is identical on every machine: the Indonesian locale data available to
 * Node and to the browser differs, and a server/client mismatch would make the
 * heading change after hydration.
 */
export function monthLabel(date: string): string {
  const key = monthKey(date);
  const monthIndex = Number(key.slice(5, 7)) - 1;
  const name = MONTH_NAMES[monthIndex] ?? "";
  return `${name} ${key.slice(0, 4)}`.trim();
}

/**
 * Group matches into month buckets, preserving the order they arrived in.
 *
 * One pass over the input keeps the caller's ordering (the query already sorts
 * by date) and avoids the trap of a `Map` keyed by month plus a second sort that
 * could reorder matches inside a month. An empty list yields no groups, so the
 * page can render "no fixtures" instead of an empty heading.
 */
export function groupMatchesByMonth<T extends { date: string }>(
  matches: T[]
): { key: string; label: string; matches: T[] }[] {
  const groups: { key: string; label: string; matches: T[] }[] = [];

  for (const match of matches) {
    const key = monthKey(match.date);
    const last = groups[groups.length - 1];

    if (last && last.key === key) last.matches.push(match);
    else groups.push({ key, label: monthLabel(match.date), matches: [match] });
  }

  return groups;
}

/**
 * Describe how full a fixture's slots are.
 *
 * `slotsTotal` of zero used to divide by zero and render `NaN%`; a fixture that
 * takes no sign-ups is treated as full instead. The remaining checks run in
 * order so that "no places left" always wins over the percentage, and "low"
 * starts below a quarter of the places rather than at the last seat.
 */
export function slotStatus(
  slotsAvailable: number,
  slotsTotal: number
): { state: "full" | "low" | "open"; percent: number } {
  if (slotsTotal <= 0) return { state: "full", percent: 0 };

  const percent = Math.round((slotsAvailable / slotsTotal) * 100);
  if (slotsAvailable <= 0) return { state: "full", percent };
  if (percent < 25) return { state: "low", percent };

  return { state: "open", percent };
}

/**
 * Return the list without the match carrying `id`.
 *
 * The fixture array is handed out from a cache and shared by several pages, so
 * `filter` is used to build a new array: splicing the original would silently
 * remove the match from every other page too. An `undefined` id — no match to
 * hide — still returns a copy, so callers can treat the result uniformly.
 */
export function withoutMatch<T extends { id: string }>(
  matches: T[],
  id: string | undefined
): T[] {
  return matches.filter((match) => match.id !== id);
}
