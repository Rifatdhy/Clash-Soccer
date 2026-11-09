import test from "node:test";
import assert from "node:assert/strict";

import { pickNextMatch, sortByKickoff, splitMatchesByTiming } from "../src/lib/match-groups.ts";

function match(id: string, status: "upcoming" | "ongoing" | "completed") {
  return { id, status } as { id: string; status: "upcoming" | "ongoing" | "completed" };
}

function timed(
  id: string,
  date: string,
  time: string,
  status: "upcoming" | "ongoing" | "completed"
) {
  return { id, date, time, status };
}

test("a live match belongs with the matches still to come", () => {
  // A match in progress is not over. Filtering only `upcoming` dropped it from
  // the page entirely: the match existed, the API returned it, and /schedule
  // showed nothing. It also disappears from "past matches", so it was in
  // neither list.
  const { current, past } = splitMatchesByTiming([
    match("live", "ongoing"),
    match("next", "upcoming"),
    match("done", "completed"),
  ]);

  assert.deepEqual(current.map((m) => m.id), ["live", "next"]);
  assert.deepEqual(past.map((m) => m.id), ["done"]);
});

test("every match lands in exactly one group", () => {
  // Guards the original bug class: a status that matches no filter is silently
  // dropped from the page.
  const all = [match("a", "upcoming"), match("b", "ongoing"), match("c", "completed")];
  const { current, past } = splitMatchesByTiming(all);

  assert.equal(current.length + past.length, all.length);
  const seen = new Set([...current, ...past].map((m) => m.id));
  assert.equal(seen.size, all.length);
});

test("an empty list yields two empty groups", () => {
  const { current, past } = splitMatchesByTiming([]);
  assert.deepEqual(current, []);
  assert.deepEqual(past, []);
});

test("next match is the soonest one, not the last row", () => {
  // fetchMatches orders `date DESC`, so the first non-completed row is the
  // FURTHEST match. The home page used it as "Next Match", which advertised a
  // final three weeks away while a semifinal was four days out.
  const next = pickNextMatch([
    timed("final", "2026-11-27", "16:00", "upcoming"),
    timed("beji", "2026-11-20", "19:00", "upcoming"),
    timed("semifinal", "2026-11-13", "16:00", "upcoming"),
  ]);

  assert.equal(next?.id, "semifinal");
});

test("a live match outranks a later upcoming one", () => {
  // A match being played right now is the most relevant thing on the page.
  const next = pickNextMatch([
    timed("semifinal", "2026-11-13", "16:00", "upcoming"),
    timed("live", "2026-11-09", "20:00", "ongoing"),
  ]);

  assert.equal(next?.id, "live");
});

test("same-day matches are ordered by kick-off time", () => {
  const next = pickNextMatch([
    timed("evening", "2026-11-13", "20:00", "upcoming"),
    timed("afternoon", "2026-11-13", "16:00", "upcoming"),
  ]);

  assert.equal(next?.id, "afternoon");
});

test("no current matches means no next match", () => {
  assert.equal(pickNextMatch([]), undefined);
});

test("upcoming lists are ordered soonest first", () => {
  // The query returns newest-first for the admin table. A public list showing
  // the three furthest-away matches is technically "upcoming" but useless.
  const sorted = sortByKickoff([
    timed("final", "2026-11-27", "16:00", "upcoming"),
    timed("semifinal", "2026-11-13", "16:00", "upcoming"),
    timed("beji", "2026-11-20", "19:00", "upcoming"),
  ]);

  assert.deepEqual(sorted.map((m) => m.id), ["semifinal", "beji", "final"]);
});

test("sorting leaves the caller's array untouched", () => {
  // fetchMatches hands out a cached array. Sorting it in place would reorder
  // the admin list and every other page that shares the cache entry.
  const input = [
    timed("final", "2026-11-27", "16:00", "upcoming"),
    timed("semifinal", "2026-11-13", "16:00", "upcoming"),
  ];
  sortByKickoff(input);

  assert.deepEqual(input.map((m) => m.id), ["final", "semifinal"]);
});
