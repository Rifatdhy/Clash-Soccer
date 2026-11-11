import test from "node:test";
import assert from "node:assert/strict";
import { matchCreateSchema, matchUpdateSchema } from "../src/lib/match-schema.ts";

const base = {
  id: "match-1",
  title: "Weekly Match",
  date: "2026-01-01",
  time: "19:00",
  location: "Lapangan",
  slotsTotal: 20,
};

test("create schema defaults status to upcoming", () => {
  const parsed = matchCreateSchema.parse(base);
  assert.equal(parsed.status, "upcoming");
});

test("partial update does not inject a default status", () => {
  const parsed = matchUpdateSchema.parse({ id: base.id, title: "Renamed" });
  assert.equal("status" in parsed, false);
});

test("partial update keeps an explicitly provided status", () => {
  const parsed = matchUpdateSchema.parse({ id: base.id, status: "completed" });
  assert.equal(parsed.status, "completed");
});

test("update requires an id and validates slot arithmetic", () => {
  assert.equal(matchUpdateSchema.safeParse({ title: "x" }).success, false);
  assert.equal(
    matchUpdateSchema.safeParse({ id: base.id, slotsTotal: 5, slotsAvailable: 6 }).success,
    false
  );
});

test("create schema rejects impossible and non-ISO dates", () => {
  for (const date of ["2026-02-30", "2026-13-01", "01/02/2026", "5", "2026-01-01T00:00:00Z"]) {
    assert.equal(matchCreateSchema.safeParse({ ...base, date }).success, false, date);
  }
  assert.equal(matchCreateSchema.safeParse({ ...base, date: "2026-02-28" }).success, true);
});
