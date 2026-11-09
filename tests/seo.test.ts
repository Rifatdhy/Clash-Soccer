import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSitemapEntries,
  buildSportsClubJsonLd,
  buildContentPaths,
} from "../src/lib/seo.ts";

test("buildSitemapEntries joins paths to the base url", () => {
  const entries = buildSitemapEntries("https://example.com", ["/", "/news", "/faq"]);
  assert.deepEqual(entries.map((e) => e.url), [
    "https://example.com/",
    "https://example.com/news",
    "https://example.com/faq",
  ]);
});

test("buildSitemapEntries tolerates trailing slashes and duplicate slashes", () => {
  const entries = buildSitemapEntries("https://example.com/", ["/news"]);
  assert.deepEqual(entries.map((e) => e.url), ["https://example.com/news"]);
});

test("buildSportsClubJsonLd emits SportsClub data", () => {
  const data = buildSportsClubJsonLd({
    name: "Clash.Soccer",
    description: "Komunitas mini soccer",
    url: "https://example.com",
    logo: "https://example.com/logo.png",
  });
  assert.equal(data["@context"], "https://schema.org");
  assert.equal(data["@type"], "SportsClub");
  assert.equal(data.name, "Clash.Soccer");
  assert.equal(data.logo, "https://example.com/logo.png");
});

test("buildContentPaths adds news slugs and album ids to the static pages", () => {
  const paths = buildContentPaths({
    news: [{ slug: "weekly-recap" }, { slug: "new-kit" }],
    albums: [{ id: "a1" }],
  });

  assert.deepEqual(paths, [
    "/news/weekly-recap",
    "/news/new-kit",
    "/gallery/a1",
  ]);
});

test("buildContentPaths skips blank slugs and duplicate ids", () => {
  const paths = buildContentPaths({
    news: [{ slug: "same" }, { slug: "same" }, { slug: "  " }],
    albums: [{ id: "" }, { id: "a1" }],
  });

  assert.deepEqual(paths, ["/news/same", "/gallery/a1"]);
});

test("buildContentPaths returns nothing when there is no content", () => {
  assert.deepEqual(buildContentPaths({ news: [], albums: [] }), []);
});
