import test from "node:test";
import assert from "node:assert/strict";
import { SignJWT } from "jose";

import {
  createAdminSessionToken,
  verifyAdminSessionToken,
} from "../src/lib/admin-session.ts";

const SECRET = "test-secret-key-that-is-long-enough-for-hs256";
const OTHER_SECRET = "a-completely-different-secret-value-123456";
const USERNAME = "admin";

process.env.ADMIN_AUTH_SECRET = SECRET;
process.env.ADMIN_USERNAME = USERNAME;

/**
 * The issuer and audience are part of the session contract: the proxy and the
 * route handlers reject a token that carries different ones. They are spelled
 * out here so a change to either constant fails loudly instead of silently
 * widening what counts as a valid session.
 */
async function signWith(
  secret: string,
  options: { username?: string; expiration?: string } = {}
) {
  return new SignJWT({ username: options.username ?? USERNAME })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("clash-soccer:auth")
    .setAudience("clash-soccer:admin")
    .setExpirationTime(options.expiration ?? "1h")
    .sign(new TextEncoder().encode(secret));
}

test("a token created for the configured admin verifies", async () => {
  const token = await createAdminSessionToken(USERNAME);
  assert.equal(await verifyAdminSessionToken(token), true);
});

test("a token created for another username is rejected", async () => {
  const token = await createAdminSessionToken("someone-else");
  assert.equal(await verifyAdminSessionToken(token), false);
});

test("a missing or empty token is rejected", async () => {
  assert.equal(await verifyAdminSessionToken(undefined), false);
  assert.equal(await verifyAdminSessionToken(""), false);
  assert.equal(await verifyAdminSessionToken("not-a-jwt"), false);
});

test("a tampered token is rejected", async () => {
  const token = await createAdminSessionToken(USERNAME);
  const [header, , signature] = token.split(".");
  const forgedPayload = Buffer.from(
    JSON.stringify({ username: USERNAME, iss: "clash-soccer:auth" })
  ).toString("base64url");

  assert.equal(
    await verifyAdminSessionToken(`${header}.${forgedPayload}.${signature}`),
    false
  );
});

test("a token signed with a different secret is rejected", async () => {
  const token = await signWith(OTHER_SECRET);
  assert.equal(await verifyAdminSessionToken(token), false);
});

test("an expired token is rejected", async () => {
  const token = await signWith(SECRET, { expiration: "-1h" });
  assert.equal(await verifyAdminSessionToken(token), false);
});

test("a token with a different audience or issuer is rejected", async () => {
  const wrongAudience = await new SignJWT({ username: USERNAME })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("clash-soccer:auth")
    .setAudience("clash-soccer:public")
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(SECRET));

  const wrongIssuer = await new SignJWT({ username: USERNAME })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer("somebody-else")
    .setAudience("clash-soccer:admin")
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(SECRET));

  assert.equal(await verifyAdminSessionToken(wrongAudience), false);
  assert.equal(await verifyAdminSessionToken(wrongIssuer), false);
});

test("no token verifies while ADMIN_USERNAME is not configured", async () => {
  const token = await createAdminSessionToken(USERNAME);
  const original = process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_USERNAME;

  try {
    assert.equal(await verifyAdminSessionToken(token), false);
  } finally {
    process.env.ADMIN_USERNAME = original;
  }
});

test("production refuses to sign a session without ADMIN_AUTH_SECRET", async () => {
  const originalSecret = process.env.ADMIN_AUTH_SECRET;
  const originalEnv = process.env.NODE_ENV;
  delete process.env.ADMIN_AUTH_SECRET;

  try {
    // NODE_ENV is read-only in @types/node, but the runtime allows assignment.
    (process.env as Record<string, string | undefined>).NODE_ENV = "production";
    await assert.rejects(() => createAdminSessionToken(USERNAME), /ADMIN_AUTH_SECRET/);
  } finally {
    if (originalSecret === undefined) delete process.env.ADMIN_AUTH_SECRET;
    else process.env.ADMIN_AUTH_SECRET = originalSecret;

    if (originalEnv === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV;
    else (process.env as Record<string, string | undefined>).NODE_ENV = originalEnv;
  }
});
