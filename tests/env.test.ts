import test from "node:test";
import assert from "node:assert/strict";
import { validateEnv, formatEnvIssues } from "../src/lib/env.ts";

const valid = {
  DATABASE_URL: "postgresql://u:p@localhost:5432/db",
  ADMIN_USERNAME: "admin",
  ADMIN_AUTH_SECRET: "x".repeat(32),
  ADMIN_PASSWORD_HASH: "scrypt$c2FsdA==$aGFzaA==",
  SITE_URL: "https://example.com",
};

test("validateEnv accepts a complete production environment", () => {
  assert.deepEqual(validateEnv(valid, true), []);
});

test("validateEnv reports every missing production key", () => {
  const issues = validateEnv({}, true);
  const keys = issues.map((i) => i.key).sort();
  assert.deepEqual(keys, ["ADMIN_AUTH_SECRET", "ADMIN_PASSWORD", "ADMIN_USERNAME", "DATABASE_URL", "SITE_URL"]);
});

test("validateEnv reports a weak auth secret", () => {
  const issues = validateEnv({ ...valid, ADMIN_AUTH_SECRET: "short" }, true);
  assert.equal(issues.some((i) => i.key === "ADMIN_AUTH_SECRET" && i.kind === "weak"), true);
});

test("validateEnv accepts ADMIN_PASSWORD as an alternative to a hash", () => {
  const rest = Object.fromEntries(
    Object.entries(valid).filter(([key]) => key !== "ADMIN_PASSWORD_HASH")
  );
  assert.deepEqual(validateEnv({ ...rest, ADMIN_PASSWORD: "secret" }, true), []);
});

test("validateEnv only warns in development", () => {
  assert.deepEqual(validateEnv({}, false), []);
});

test("formatEnvIssues never includes secret values", () => {
  const issues = validateEnv({ ...valid, ADMIN_AUTH_SECRET: "short" }, true);
  const text = formatEnvIssues(issues).join("\n");
  assert.match(text, /ADMIN_AUTH_SECRET/);
  assert.doesNotMatch(text, /short/);
});
