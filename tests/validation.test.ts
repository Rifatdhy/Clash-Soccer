import test from "node:test";
import assert from "node:assert/strict";

import {
  isAllowedImageUrl,
  isDataImageUrl,
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

test("uploaded data images are allowed", () => {
  assert.equal(isDataImageUrl("data:image/png;base64,iVBORw0KGgo="), true);
  assert.equal(isAllowedImageUrl("data:image/webp;base64,AAAA"), true);
});

test("uploads larger than the server cap are rejected", () => {
  const oversized = "data:image/png;base64," + "A".repeat(2_000_001);
  assert.equal(isAllowedImageUrl(oversized), false);
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
