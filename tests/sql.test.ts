import test from "node:test";
import assert from "node:assert/strict";

import { buildUpdate } from "../src/lib/sql.ts";

const mapping = {
  title: "title",
  matchDate: "match_date",
  coverUrl: "cover_url",
};

test("maps camelCase keys to their column and appends the id last", () => {
  const plan = buildUpdate("albums", "id", "a1", mapping, {
    title: "Final",
    matchDate: "2026-07-01",
  });
  assert.deepEqual(plan, {
    text: "UPDATE albums SET title = $1, match_date = $2 WHERE id = $3",
    values: ["Final", "2026-07-01", "a1"],
  });
});

test("ignores unknown keys", () => {
  const plan = buildUpdate("albums", "id", "a1", mapping, {
    title: "Final",
    hacked: "DROP TABLE albums",
  });
  assert.deepEqual(plan?.values, ["Final", "a1"]);
});

test("ignores undefined values but keeps empty strings and zero", () => {
  const plan = buildUpdate("albums", "id", "a1", mapping, {
    title: "",
    matchDate: undefined,
  });
  assert.deepEqual(plan, {
    text: "UPDATE albums SET title = $1 WHERE id = $2",
    values: ["", "a1"],
  });
});

test("returns null when nothing is updatable", () => {
  assert.equal(buildUpdate("albums", "id", "a1", mapping, {}), null);
  assert.equal(buildUpdate("albums", "id", "a1", mapping, { title: undefined }), null);
});
