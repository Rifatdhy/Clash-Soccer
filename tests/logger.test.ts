import test from "node:test";
import assert from "node:assert/strict";
import { redact, resolveRequestId } from "../src/lib/logger.ts";

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

test("resolveRequestId keeps a well formed inbound id", () => {
  const request = new Request("http://localhost/api/x", {
    headers: { "x-request-id": "abc-123" },
  });
  assert.equal(resolveRequestId(request), "abc-123");
});

test("resolveRequestId generates a uuid when the header is absent", () => {
  const id = resolveRequestId(new Request("http://localhost/api/x"));
  assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
});

test("resolveRequestId replaces ids that are malformed or too long", () => {
  // Newlines and tabs cannot even be set as a header value, so the values
  // that matter here are ones a client can actually send.
  for (const bad of ["has space", "a".repeat(200), "id/with/slashes"]) {
    const request = new Request("http://localhost/api/x", {
      headers: { "x-request-id": bad },
    });
    const id = resolveRequestId(request);
    assert.match(id, /^[A-Za-z0-9._:-]{1,128}$/);
    assert.notEqual(id, bad);
  }
});
