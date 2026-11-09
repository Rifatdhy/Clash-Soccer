import test from "node:test";
import assert from "node:assert/strict";

// `monthKey` is exported for the schedule page but no test below calls it
// directly, so importing it would only trip the unused-vars lint rule.
import {
  groupMatchesByMonth,
  monthLabel,
  slotStatus,
  withoutMatch,
} from "../src/lib/schedule-layout.ts";

test("monthLabel menulis nama bulan dalam bahasa Indonesia", () => {
  assert.equal(monthLabel("2026-11-09"), "November 2026");
  assert.equal(monthLabel("2026-01-01"), "Januari 2026");
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

test("withoutMatch membuang satu laga tanpa mengubah array asli", () => {
  const matches = [{ id: "a" }, { id: "b" }];
  const result = withoutMatch(matches, "a");
  assert.deepEqual(result.map((m) => m.id), ["b"]);
  assert.equal(matches.length, 2);
});

test("withoutMatch mengembalikan salinan saat id tidak ditemukan", () => {
  const matches = [{ id: "a" }];
  assert.deepEqual(withoutMatch(matches, "z").map((m) => m.id), ["a"]);
  assert.deepEqual(withoutMatch(matches, undefined).map((m) => m.id), ["a"]);
});
