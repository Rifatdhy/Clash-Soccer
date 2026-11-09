/**
 * Split matches into "still relevant" and "already played".
 *
 * The schedule page used to filter `status === "upcoming"` for the first list
 * and `status === "completed"` for the second. An `ongoing` match matched
 * neither, so a live match vanished from the page: still in the database, still
 * returned by `/api/matches`, but rendered nowhere.
 *
 * Treating everything that is not `completed` as current means a status added
 * later cannot silently disappear the same way.
 */
export function splitMatchesByTiming<T extends { status: string }>(matches: T[]): {
  current: T[];
  past: T[];
} {
  const current: T[] = [];
  const past: T[] = [];

  for (const match of matches) {
    if (match.status === "completed") past.push(match);
    else current.push(match);
  }

  return { current, past };
}

/**
 * Pick the match to advertise as "Next Match".
 *
 * `fetchMatches` orders by `date DESC`, so the first row is the furthest in the
 * future — the home page used to promote a final three weeks away while a
 * semifinal four days out was also on the calendar. Sorting ascending fixes
 * that, and a match already in progress wins outright because it is the most
 * relevant thing on the page.
 */
export function pickNextMatch<T extends { date: string; time: string; status: string }>(
  matches: T[]
): T | undefined {
  const sorted = sortByKickoff(matches.filter((match) => match.status !== "completed"));
  const live = sorted.find((match) => match.status === "ongoing");
  return live ?? sorted[0];
}

/**
 * Order matches by kick-off, soonest first.
 *
 * The query returns `date DESC` for the admin table, where newest-first is what
 * you want. Every public "what's coming up" list needs the opposite order.
 */
export function sortByKickoff<T extends { date: string; time: string }>(matches: T[]): T[] {
  return [...matches].sort((a, b) => {
    const left = `${a.date}T${a.time}`;
    const right = `${b.date}T${b.time}`;
    if (left < right) return -1;
    if (left > right) return 1;
    return 0;
  });
}
