import test from "node:test";
import assert from "node:assert/strict";

import { groupAlbumItems } from "../src/lib/albums.ts";

const item = (id: string, albumId: string) => ({
  id,
  album_id: albumId,
  type: "image",
  url: `https://images.unsplash.com/${id}`,
  thumbnail_url: null,
});

test("groups items by album id", () => {
  const grouped = groupAlbumItems([
    item("i1", "a1"),
    item("i2", "a2"),
    item("i3", "a1"),
  ]);
  assert.deepEqual(grouped.get("a1")?.map((i) => i.id), ["i1", "i3"]);
  assert.deepEqual(grouped.get("a2")?.map((i) => i.id), ["i2"]);
});

test("albums without items get an empty list, not undefined", () => {
  const grouped = groupAlbumItems([]);
  assert.deepEqual(grouped.get("missing") ?? [], []);
});

test("each album gets its own list", () => {
  const grouped = groupAlbumItems([item("i1", "a1")]);
  grouped.get("a2")?.push(item("i2", "a2"));
  assert.equal(grouped.get("a1")?.length, 1);
});
