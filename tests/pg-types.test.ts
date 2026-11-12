import test from "node:test";
import assert from "node:assert/strict";
import { configurePgTypes } from "../src/lib/pg-types.ts";

test("DATE columns are returned as plain YYYY-MM-DD strings", () => {
  const registered: Array<{ oid: number; parse: (value: string) => unknown }> = [];

  configurePgTypes({
    setTypeParser(oid, parse) {
      registered.push({ oid, parse });
    },
  });

  const date = registered.find((entry) => entry.oid === 1082);
  assert.ok(date, "expected an OID 1082 parser");
  assert.equal(date.parse("2026-01-01"), "2026-01-01");
});
