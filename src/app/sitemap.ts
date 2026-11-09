import type { MetadataRoute } from "next";
import { fetchAlbums, fetchNews } from "@/lib/data";
import {
  buildContentPaths,
  buildSitemapEntries,
  getSiteUrl,
  sitemapMetaFor,
} from "@/lib/seo";

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

  // A path with no known metadata is left out of the sitemap instead of being
  // labelled as news; only paths `sitemapMetaFor` understands get an entry.
  const contentEntries = buildSitemapEntries(base, contentPaths).flatMap((entry) => {
    const meta = sitemapMetaFor(new URL(entry.url).pathname);
    if (!meta) return [];
    return [{ ...entry, lastModified: now, ...meta }];
  });

  return [...staticEntries, ...contentEntries];
}

