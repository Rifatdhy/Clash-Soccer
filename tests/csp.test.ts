import test from "node:test";
import assert from "node:assert/strict";
import { buildCsp } from "../src/lib/csp.ts";

test("production CSP uses a nonce and no unsafe-inline scripts", () => {
  const csp = buildCsp("abc123", false);
  assert.match(csp, /script-src 'self' 'nonce-abc123' 'strict-dynamic'/);
  assert.doesNotMatch(csp, /script-src[^;]*unsafe-inline/);
  assert.doesNotMatch(csp, /unsafe-eval/);
});

test("development CSP allows eval for React refresh", () => {
  assert.match(buildCsp("abc123", true), /unsafe-eval/);
});

test("CSP keeps required security directives", () => {
  const csp = buildCsp("abc123", false);
  for (const directive of [
    "default-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ]) {
    assert.ok(csp.includes(directive), directive);
  }
});

test("CSP allows inline styles and the image hosts the app uses", () => {
  const csp = buildCsp("abc123", false);
  assert.match(csp, /style-src 'self' 'unsafe-inline'/);
  assert.match(
    csp,
    /img-src 'self' data: blob: https:\/\/lh3\.googleusercontent\.com https:\/\/images\.unsplash\.com/
  );
  assert.match(csp, /frame-src 'self' https:\/\/www\.google\.com/);
});
