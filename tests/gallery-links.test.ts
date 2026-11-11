import test from "node:test";
import assert from "node:assert/strict";
import { albumDetailHref, videoItemHref } from "../src/lib/gallery-links.ts";

test("video items link to their own URL", () => {
  assert.equal(
    videoItemHref({ type: "video", url: "https://youtube.com/watch?v=abc" }),
    "https://youtube.com/watch?v=abc"
  );
  assert.equal(videoItemHref({ type: "image", url: "/api/uploads/a.jpg" }), null);
  assert.equal(videoItemHref({ type: "video", url: "" }), null);
});

test("albums always keep a detail link, even with a Drive link", () => {
  assert.equal(albumDetailHref({ id: "album-1" }), "/gallery/album-1");
});
