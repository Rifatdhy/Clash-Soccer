import test from "node:test";
import assert from "node:assert/strict";

import {
  exceedsByteLimit,
  MAX_JSON_BODY_BYTES,
  MAX_UPLOAD_BYTES,
  isAllowedImageUrl,
  isHttpUrl,
  sanitizeNextPath,
} from "../src/lib/validation.ts";

test("an empty image value is allowed because images are optional", () => {
  assert.equal(isAllowedImageUrl(""), true);
});

test("images from the configured hosts are allowed", () => {
  assert.equal(
    isAllowedImageUrl("https://images.unsplash.com/photo-123"),
    true
  );
  assert.equal(
    isAllowedImageUrl("https://lh3.googleusercontent.com/abc"),
    true
  );
});

test("images from other hosts are rejected", () => {
  assert.equal(isAllowedImageUrl("https://evil.example/photo.png"), false);
  assert.equal(isAllowedImageUrl("http://images.unsplash.com/photo-123"), false);
});

test("locally stored upload URLs are allowed", () => {
  assert.equal(isAllowedImageUrl("/api/uploads/abc.png"), true);
});

test("upload paths cannot escape their directory", () => {
  assert.equal(isAllowedImageUrl("/api/uploads/../secret.png"), false);
  assert.equal(isAllowedImageUrl("/api/uploads/a/../../secret.png"), false);
  assert.equal(isAllowedImageUrl("/api/uploads/"), false);
  assert.equal(isAllowedImageUrl("//evil.example/api/uploads/a.png"), false);
});

test("data URLs are rejected: images must go through the upload API", () => {
  assert.equal(isAllowedImageUrl("data:image/png;base64,iVBORw0KGgo="), false);
  assert.equal(isAllowedImageUrl("data:image/webp;base64,AAAA"), false);
});

test("javascript and random strings are not image URLs", () => {
  assert.equal(isAllowedImageUrl("javascript:alert(1)"), false);
  assert.equal(isAllowedImageUrl("not a url"), false);
});

test("video links accept any http or https URL", () => {
  assert.equal(isHttpUrl("https://youtu.be/abc"), true);
  assert.equal(isHttpUrl("http://example.com/video.mp4"), true);
  assert.equal(isHttpUrl("javascript:alert(1)"), false);
  assert.equal(isHttpUrl("data:image/png;base64,AAAA"), false);
});

test("a local path is accepted as the post-login destination", () => {
  assert.equal(sanitizeNextPath("/admin/matches"), "/admin/matches");
});

test("an absolute URL is replaced with the fallback", () => {
  assert.equal(
    sanitizeNextPath("https://situs-palsu.example", "/admin"),
    "/admin"
  );
});

test("a protocol-relative path is replaced with the fallback", () => {
  assert.equal(sanitizeNextPath("//situs-palsu.example", "/admin"), "/admin");
});

test("a javascript URL is replaced with the fallback", () => {
  assert.equal(sanitizeNextPath("javascript:alert(1)", "/admin"), "/admin");
});

test("missing destination uses the fallback", () => {
  assert.equal(sanitizeNextPath(null, "/admin"), "/admin");
});

test("exceedsByteLimit compares a declared length against a cap", () => {
  assert.equal(exceedsByteLimit("101", 100), true);
  assert.equal(exceedsByteLimit("100", 100), false);
  assert.equal(exceedsByteLimit("99", 100), false);
});

test("exceedsByteLimit ignores a missing or nonsense header", () => {
  assert.equal(exceedsByteLimit(null, 100), false);
  assert.equal(exceedsByteLimit("", 100), false);
  assert.equal(exceedsByteLimit("abc", 100), false);
  assert.equal(exceedsByteLimit("-1", 100), false);
});

test("a JSON body cap exists and is smaller than the upload cap", () => {
  assert.ok(MAX_JSON_BODY_BYTES > 0);
  assert.ok(MAX_JSON_BODY_BYTES <= MAX_UPLOAD_BYTES);
});
