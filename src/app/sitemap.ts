import type { MetadataRoute } from "next";
import { fetchAlbums, fetchNews } from "@/lib/data";
import { buildContentPaths, buildSitemapEntries, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const PAGES = [
  { path: "/", changeFrequency: "weekly" as const, priority: 1 },
  { path: "/schedule", changeFrequency: "weekly" as const, priority: 0.9 },
  { path: "/news", changeFrequency: "daily" as const, priority: 0.8 },
  { path: "/gallery", changeFrequency: "weekly" as const, priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly" as const, priority: 0.6 },
  { path: "/about", changeFrequency: "monthly" as const, priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly" as const, priority: 0.5 },
];

const CONTENT_META = {
  news: { changeFrequency: "monthly" as const, priority: 0.6 },
  gallery: { changeFrequency: "monthly" as const, priority: 0.5 },
};

function metaFor(path: string) {
  if (path.startsWith("/news/")) return CONTENT_META.news;
  if (path.startsWith("/gallery/")) return CONTENT_META.gallery;
  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const base = getSiteUrl();

  // Detail pages live in the database, so the sitemap lists the rows that
  // exist rather than only the fixed list pages. A failed read must not take
  // the whole sitemap down, so content is best-effort.
  let contentPaths: string[] = [];
  try {
    const [news, albums] = await Promise.all([fetchNews(), fetchAlbums()]);
    contentPaths = buildContentPaths({ news, albums });
  } catch {
    contentPaths = [];
  }

  const staticEntries = buildSitemapEntries(
    base,
    PAGES.map((page) => page.path)
  ).map((entry, index) => ({
    ...entry,
    lastModified: now,
    changeFrequency: PAGES[index].changeFrequency,
    priority: PAGES[index].priority,
  }));

  const contentEntries = buildSitemapEntries(base, contentPaths).map((entry) => ({
    ...entry,
    lastModified: now,
    ...(metaFor(new URL(entry.url).pathname) ?? CONTENT_META.news),
  }));

  return [...staticEntries, ...contentEntries];
}
