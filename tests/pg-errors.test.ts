import test from "node:test";
import assert from "node:assert/strict";

import { isUniqueViolation } from "../src/lib/pg-errors.ts";

test("detects a PostgreSQL unique violation", () => {
  assert.equal(isUniqueViolation({ code: "23505" }), true);
});

test("ignores other database errors and non-objects", () => {
  assert.equal(isUniqueViolation({ code: "23503" }), false);
  assert.equal(isUniqueViolation(new Error("boom")), false);
  assert.equal(isUniqueViolation(null), false);
  assert.equal(isUniqueViolation("23505"), false);
});
