import test from "node:test";
import assert from "node:assert/strict";
import { buildSitemapEntries, buildSportsClubJsonLd } from "../src/lib/seo.ts";

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
