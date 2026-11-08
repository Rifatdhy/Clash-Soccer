import type { MetadataRoute } from "next";
import { buildSitemapEntries, getSiteUrl } from "@/lib/seo";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const entries = buildSitemapEntries(
    getSiteUrl(),
    PAGES.map((page) => page.path)
  );

  return entries.map((entry, index) => ({
    ...entry,
    lastModified: now,
    changeFrequency: PAGES[index].changeFrequency,
    priority: PAGES[index].priority,
  }));
}
