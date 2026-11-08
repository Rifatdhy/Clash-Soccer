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

test("redact serializes Error objects instead of dropping their message", () => {
  const error = new Error("database exploded");
  const redacted = redact({ error }) as { error: Record<string, unknown> };

  assert.equal(redacted.error.name, "Error");
  assert.equal(redacted.error.message, "database exploded");
  assert.equal(typeof redacted.error.stack, "string");
});

test("redact serializes nested errors inside arrays", () => {
  const redacted = redact([new Error("first")]) as Array<Record<string, unknown>>;
  assert.equal(redacted[0].message, "first");
});
