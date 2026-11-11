import test from "node:test";
import assert from "node:assert/strict";
import { formatDate, parseDateOnly } from "../src/lib/format.ts";

test("parseDateOnly keeps the calendar day regardless of timezone", () => {
  const date = parseDateOnly("2026-01-01");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 0);
  assert.equal(date.getDate(), 1);
});

test("formatDate renders a date-only string on the same day", () => {
  assert.equal(formatDate("2026-01-01"), "1 Jan 2026");
});

test("formatDate still accepts a full ISO datetime", () => {
  assert.equal(formatDate("2026-01-01T12:00:00.000Z"), "1 Jan 2026");
});
