import test from "node:test";
import assert from "node:assert/strict";

import {
  consume,
  getClientIp,
  resetRateLimit,
  RATE_LIMIT_DEFAULTS,
} from "../src/lib/rate-limit.ts";

test("first attempt is allowed", () => {
  const result = consume("login", "1.2.3.4", RATE_LIMIT_DEFAULTS);
  assert.equal(result.allowed, true);
});

test("attempts beyond the maximum are blocked", () => {
  resetRateLimit("login", "9.9.9.9");
  for (let i = 0; i < RATE_LIMIT_DEFAULTS.max; i += 1) {
    consume("login", "9.9.9.9", RATE_LIMIT_DEFAULTS);
  }
  const blocked = consume("login", "9.9.9.9", RATE_LIMIT_DEFAULTS);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
});

test("scopes do not share counters", () => {
  resetRateLimit("login", "5.5.5.5");
  resetRateLimit("rsvp", "5.5.5.5");
  for (let i = 0; i < RATE_LIMIT_DEFAULTS.max; i += 1) {
    consume("login", "5.5.5.5", RATE_LIMIT_DEFAULTS);
  }
  assert.equal(consume("login", "5.5.5.5", RATE_LIMIT_DEFAULTS).allowed, false);
  assert.equal(consume("rsvp", "5.5.5.5", RATE_LIMIT_DEFAULTS).allowed, true);
});

test("reset clears a bucket", () => {
  resetRateLimit("login", "7.7.7.7");
  for (let i = 0; i <= RATE_LIMIT_DEFAULTS.max; i += 1) {
    consume("login", "7.7.7.7", RATE_LIMIT_DEFAULTS);
  }
  resetRateLimit("login", "7.7.7.7");
  assert.equal(consume("login", "7.7.7.7", RATE_LIMIT_DEFAULTS).allowed, true);
});

test("client ip prefers the first forwarded address", () => {
  const request = new Request("http://localhost/api/login", {
    headers: { "x-forwarded-for": "1.1.1.1, 2.2.2.2" },
  });
  assert.equal(getClientIp(request), "1.1.1.1");
});

test("client ip falls back to x-real-ip then unknown", () => {
  const realIp = new Request("http://localhost/api/login", {
    headers: { "x-real-ip": "3.3.3.3" },
  });
  assert.equal(getClientIp(realIp), "3.3.3.3");
  assert.equal(getClientIp(new Request("http://localhost/api/login")), "unknown");
});
