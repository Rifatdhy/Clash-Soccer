import test from "node:test";
import assert from "node:assert/strict";
import { describeHealth } from "../src/lib/health.ts";

test("a healthy database with valid config reports ok", () => {
  const result = describeHealth({ databaseOk: true, configIssues: [] });
  assert.equal(result.status, "ok");
  assert.equal(result.database, "ok");
  assert.equal(result.config, "ok");
  assert.equal(result.httpStatus, 200);
});

test("a reachable database with missing production config is degraded, not ok", () => {
  const result = describeHealth({
    databaseOk: true,
    configIssues: ["SITE_URL: SITE_URL is required in production."],
  });
  assert.equal(result.status, "degraded");
  assert.equal(result.database, "ok");
  assert.equal(result.config, "degraded");
  assert.equal(result.httpStatus, 503);
});

test("an unreachable database is an error even when config is valid", () => {
  const result = describeHealth({ databaseOk: false, configIssues: [] });
  assert.equal(result.status, "error");
  assert.equal(result.database, "error");
  assert.equal(result.config, "ok");
  assert.equal(result.httpStatus, 503);
});

test("an unreachable database with bad config reports both problems", () => {
  const result = describeHealth({
    databaseOk: false,
    configIssues: ["DATABASE_URL: DATABASE_URL is required in production."],
  });
  assert.equal(result.status, "error");
  assert.equal(result.config, "degraded");
  assert.equal(result.httpStatus, 503);
});
