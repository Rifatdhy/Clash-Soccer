import test from "node:test";
import assert from "node:assert/strict";

import {
  consume,
  consumeLoginAttempt,
  getClientIp,
  LOGIN_GLOBAL_RATE_LIMIT,
  resetLoginIpBucket,
  resetRateLimit,
  setRateLimitStore,
  RATE_LIMIT_DEFAULTS,
  UNKNOWN_CLIENT_IP,
} from "../src/lib/rate-limit.ts";
import { createMemoryStore } from "../src/lib/rate-limit-store.ts";
import { retryAfterSeconds } from "../src/lib/retry-after.ts";

test("first attempt is allowed", async () => {
  const result = await consume("login", "1.2.3.4", RATE_LIMIT_DEFAULTS);
  assert.equal(result.allowed, true);
});

test("attempts beyond the maximum are blocked", async () => {
  await resetRateLimit("login", "9.9.9.9");
  for (let i = 0; i < RATE_LIMIT_DEFAULTS.max; i += 1) {
    await consume("login", "9.9.9.9", RATE_LIMIT_DEFAULTS);
  }
  const blocked = await consume("login", "9.9.9.9", RATE_LIMIT_DEFAULTS);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterMs > 0);
});

test("scopes do not share counters", async () => {
  await resetRateLimit("login", "5.5.5.5");
  await resetRateLimit("rsvp", "5.5.5.5");
  for (let i = 0; i < RATE_LIMIT_DEFAULTS.max; i += 1) {
    await consume("login", "5.5.5.5", RATE_LIMIT_DEFAULTS);
  }
  assert.equal((await consume("login", "5.5.5.5", RATE_LIMIT_DEFAULTS)).allowed, false);
  assert.equal((await consume("rsvp", "5.5.5.5", RATE_LIMIT_DEFAULTS)).allowed, true);
});

test("reset clears a bucket", async () => {
  await resetRateLimit("login", "7.7.7.7");
  for (let i = 0; i <= RATE_LIMIT_DEFAULTS.max; i += 1) {
    await consume("login", "7.7.7.7", RATE_LIMIT_DEFAULTS);
  }
  await resetRateLimit("login", "7.7.7.7");
  assert.equal((await consume("login", "7.7.7.7", RATE_LIMIT_DEFAULTS)).allowed, true);
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

test("client ip trusts x-real-ip over a spoofable forwarded header", () => {
  const request = new Request("http://localhost/api/login", {
    headers: {
      "x-real-ip": "3.3.3.3",
      "x-forwarded-for": "1.1.1.1, 3.3.3.3",
    },
  });
  assert.equal(getClientIp(request), "3.3.3.3");
});

test("consume delegates to the configured store", async () => {
  const calls: Array<{ key: string; max: number }> = [];
  setRateLimitStore({
    async consume(key, options) {
      calls.push({ key, max: options.max });
      return { allowed: false, retryAfterMs: 1234 };
    },
    async reset() {},
  });

  const result = await consume("login", "1.2.3.4", { windowMs: 1000, max: 2 });
  assert.deepEqual(result, { allowed: false, retryAfterMs: 1234 });
  assert.deepEqual(calls, [{ key: "login:1.2.3.4", max: 2 }]);
});

test("consume falls back to memory when the store throws", async () => {
  setRateLimitStore({
    async consume() {
      throw new Error("store down");
    },
    async reset() {},
  });

  const result = await consume("fallback", "ip", { windowMs: 1000, max: 2 });
  assert.equal(result.allowed, true);
});

test("retryAfterSeconds rounds up so a client never retries too early", () => {
  assert.equal(retryAfterSeconds(90_000), "90");
  assert.equal(retryAfterSeconds(1), "1");
  assert.equal(retryAfterSeconds(1_001), "2");
});

test("retryAfterSeconds never returns zero or a negative wait", () => {
  assert.equal(retryAfterSeconds(0), "1");
  assert.equal(retryAfterSeconds(-500), "1");
});

test("retryAfterSeconds returns null when there is no timing to report", () => {
  assert.equal(retryAfterSeconds(undefined), null);
  assert.equal(retryAfterSeconds(null), null);
  assert.equal(retryAfterSeconds(Number.NaN), null);
});

test("the unknown-address bucket is a named constant, not a magic string", () => {
  assert.equal(UNKNOWN_CLIENT_IP, "unknown");
  assert.equal(
    getClientIp(new Request("http://localhost/api/login")),
    UNKNOWN_CLIENT_IP
  );
});

test("login attempts from many spoofed IPs still hit a global ceiling", async () => {
  setRateLimitStore(createMemoryStore());

  for (let i = 0; i < LOGIN_GLOBAL_RATE_LIMIT.max; i += 1) {
    const result = await consumeLoginAttempt(`10.0.0.${i}`);
    assert.equal(result.allowed, true);
  }

  const blocked = await consumeLoginAttempt("203.0.113.99");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.scope, "global");
  assert.ok(blocked.retryAfterMs > 0);
});

test("resetting the IP bucket does not reset the global ceiling", async () => {
  setRateLimitStore(createMemoryStore());

  for (let i = 0; i < LOGIN_GLOBAL_RATE_LIMIT.max; i += 1) {
    await consumeLoginAttempt(`10.1.0.${i}`);
  }

  await resetLoginIpBucket("203.0.113.99");
  const blocked = await consumeLoginAttempt("203.0.113.99");
  assert.equal(blocked.allowed, false);
  assert.equal(blocked.scope, "global");
});
