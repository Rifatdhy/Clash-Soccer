import test from "node:test";
import assert from "node:assert/strict";
import { nextFocusIndex } from "../src/lib/focus.ts";

test("nextFocusIndex wraps forward past the last element", () => {
  assert.equal(nextFocusIndex(2, 3, false), 0);
});

test("nextFocusIndex wraps backward before the first element", () => {
  assert.equal(nextFocusIndex(0, 3, true), 2);
});

test("nextFocusIndex moves normally in both directions", () => {
  assert.equal(nextFocusIndex(0, 3, false), 1);
  assert.equal(nextFocusIndex(2, 3, true), 1);
});

test("nextFocusIndex returns 0 for an empty list", () => {
  assert.equal(nextFocusIndex(4, 0, false), 0);
});
