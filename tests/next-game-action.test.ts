import test from "node:test";
import assert from "node:assert/strict";
import { nextGameAction } from "../src/lib/next-game-action.ts";

test("nextGameAction points to an available next match", () => {
  assert.deepEqual(
    nextGameAction({ id: "match-1", slotsAvailable: 4 }),
    { href: "/schedule/match-1", label: "Join next game" }
  );
});

test("nextGameAction points to a full next match without promising RSVP", () => {
  assert.deepEqual(
    nextGameAction({ id: "match-2", slotsAvailable: 0 }),
    { href: "/schedule/match-2", label: "View next game" }
  );
});

test("nextGameAction falls back to the schedule when no match exists", () => {
  assert.deepEqual(nextGameAction(null), { href: "/schedule", label: "See schedule" });
});
