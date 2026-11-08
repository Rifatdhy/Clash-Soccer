import test from "node:test";
import assert from "node:assert/strict";
import { redact } from "../src/lib/logger.ts";

test("redact masks known secret keys recursively", () => {
  const input = {
    password: "p",
    nested: { token: "t", keep: "ok" },
    list: [{ authorization: "a" }],
  };

  assert.deepEqual(redact(input), {
    password: "[REDACTED]",
    nested: { token: "[REDACTED]", keep: "ok" },
    list: [{ authorization: "[REDACTED]" }],
  });
});

test("redact is case-insensitive for keys", () => {
  assert.deepEqual(redact({ Cookie: "c", API_KEY: "k" }), {
    Cookie: "[REDACTED]",
    API_KEY: "[REDACTED]",
  });
});

test("redact leaves non-secret values untouched", () => {
  assert.equal(redact("plain"), "plain");
  assert.deepEqual(redact({ route: "/api/health", count: 2 }), {
    route: "/api/health",
    count: 2,
  });
});
