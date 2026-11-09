import test from "node:test";
import assert from "node:assert/strict";

import {
  groupMatchesByMonth,
  monthKey,
  monthLabel,
  slotStatus,
  withoutMatch,
} from "../src/lib/schedule-layout.ts";

test("monthLabel menulis nama bulan dalam bahasa Indonesia", () => {
  assert.equal(monthLabel("2026-11-09"), "November 2026");
  assert.equal(monthLabel("2026-01-01"), "Januari 2026");
});

test("monthKey memotong tanggal menjadi kunci bulan", () => {
  // Slicing, not `new Date`: a date-only string is parsed as UTC, so building a
  // Date would push a first-of-month date into the previous month in any
  // timezone west of Greenwich.
  assert.equal(monthKey("2026-11-09"), "2026-11");
  assert.equal(monthKey("2026-01-01"), "2026-01");
});

test("groupMatchesByMonth mengelompokkan dan mempertahankan urutan", () => {
  const matches = [
    { id: "a", date: "2026-11-09" },
    { id: "b", date: "2026-11-27" },
    { id: "c", date: "2026-12-04" },
  ];
  const groups = groupMatchesByMonth(matches);
  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, "November 2026");
  assert.deepEqual(groups[0].matches.map((m) => m.id), ["a", "b"]);
  assert.equal(groups[1].label, "Desember 2026");
});

test("groupMatchesByMonth mengembalikan array kosong untuk input kosong", () => {
  assert.deepEqual(groupMatchesByMonth([]), []);
});

test("slotStatus menandai slot penuh", () => {
  assert.equal(slotStatus(0, 20).state, "full");
  assert.equal(slotStatus(0, 20).percent, 0);
});

test("slotStatus menandai slot menipis di bawah 25 persen", () => {
  assert.equal(slotStatus(3, 20).state, "low");
  assert.equal(slotStatus(4, 20).state, "low");
  assert.equal(slotStatus(5, 20).state, "open");
});

test("slotStatus tidak membagi nol saat slotsTotal nol", () => {
  assert.equal(slotStatus(0, 0).state, "full");
  assert.equal(slotStatus(0, 0).percent, 0);
});

test("slotStatus membulatkan persen, bukan memotong", () => {
  // Every other percent asserted here is a whole number, so floor, truncation
  // and no rounding at all would all pass. These two pin `Math.round`: 1/3 is
  // 33.33… (33) and 2/3 is 66.66… (67), which floor would report as 66.
  assert.equal(slotStatus(1, 3).percent, 33);
  assert.equal(slotStatus(2, 3).percent, 67);
});

test("withoutMatch membuang satu laga tanpa mengubah array asli", () => {
  const matches = [{ id: "a" }, { id: "b" }];
  const result = withoutMatch(matches, "a");
  assert.deepEqual(result.map((m) => m.id), ["b"]);
  assert.equal(matches.length, 2);
});

test("withoutMatch mengembalikan salinan saat id tidak ditemukan", () => {
  const matches = [{ id: "a" }];
  // Identity, not just contents: an early `return matches` would pass a
  // deepEqual check while handing the caller back the array it already owns,
  // which is exactly what `filter` exists to avoid.
  const missing = withoutMatch(matches, "z");
  assert.notEqual(missing, matches);
  assert.deepEqual(missing.map((m) => m.id), ["a"]);

  const noId = withoutMatch(matches, undefined);
  assert.notEqual(noId, matches);
  assert.deepEqual(noId.map((m) => m.id), ["a"]);
});
