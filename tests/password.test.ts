import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword } from "../src/lib/password.ts";

test("hashPassword produces a scrypt hash and verifies the same password", () => {
  const stored = hashPassword("rahasia-123");
  assert.match(stored, /^scrypt\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  assert.equal(verifyPassword("rahasia-123", stored), true);
});

test("verifyPassword rejects a wrong password", () => {
  assert.equal(verifyPassword("salah", hashPassword("rahasia-123")), false);
});

test("verifyPassword accepts a legacy plaintext secret", () => {
  assert.equal(verifyPassword("plain-secret", "plain-secret"), true);
  assert.equal(verifyPassword("wrong", "plain-secret"), false);
});

test("verifyPassword denies malformed hashes", () => {
  assert.equal(verifyPassword("x", "scrypt$not-enough-parts"), false);
  assert.equal(verifyPassword("x", "scrypt$%%%$%%%"), false);
});
