import test from "node:test";
import assert from "node:assert/strict";

import { canReserve, availableAfterTotalChange, restoreSlots } from "../src/lib/slots.ts";

test("canReserve accepts a request that fits the remaining slots", () => {
  assert.equal(canReserve(2, 2), true);
});

test("canReserve rejects a request larger than the remaining slots", () => {
  assert.equal(canReserve(2, 3), false);
});

test("canReserve rejects zero or negative requests", () => {
  assert.equal(canReserve(5, 0), false);
  assert.equal(canReserve(5, -1), false);
});

test("editing a match keeps the slots already taken", () => {
  assert.equal(availableAfterTotalChange(20, 8, 20), 8);
});

test("raising the total adds only the new slots", () => {
  assert.equal(availableAfterTotalChange(20, 8, 24), 12);
});

test("lowering the total below the registered count never goes negative", () => {
  assert.equal(availableAfterTotalChange(20, 8, 6), 0);
});

test("restoring slots from a deleted RSVP adds the participants back", () => {
  assert.equal(restoreSlots(20, 8, 4), 12);
});

test("restoring slots never exceeds the total", () => {
  assert.equal(restoreSlots(20, 18, 10), 20);
});
