const FALLBACK_SITE_URL = "http://localhost:3000";

export function getSiteUrl(env: Record<string, string | undefined> = process.env): string {
  const raw = env.SITE_URL?.trim();
  if (!raw) {
    const building = env.NEXT_PHASE === "phase-production-build";
    if (env.NODE_ENV === "production" && !building) {
      throw new Error("SITE_URL must be set in production.");
    }
    return FALLBACK_SITE_URL;
  }
  return raw.replace(/\/+$/, "");
}

export function buildSitemapEntries(
  baseUrl: string,
  paths: string[]
): Array<{ url: string }> {
  const base = baseUrl.replace(/\/+$/, "");
  const seen = new Set<string>();

  return paths.flatMap((path) => {
    const normalized = path === "/" ? "/" : `/${path.replace(/^\/+/, "")}`;
    const url = `${base}${normalized}`;
    if (seen.has(url)) return [];
    seen.add(url);
    return [{ url }];
  });
}

/**
 * Detail pages that belong in the sitemap. Public list pages are static, but
 * news articles and albums only exist at runtime, so the sitemap has to be
 * built from the rows instead of a fixed list.
 */
export function buildContentPaths(input: {
  news: Array<{ slug: string }>;
  albums: Array<{ id: string }>;
}): string[] {
  const seen = new Set<string>();
  const paths: string[] = [];

  const push = (path: string) => {
    if (seen.has(path)) return;
    seen.add(path);
    paths.push(path);
  };

  for (const article of input.news) {
    const slug = article.slug.trim();
    if (slug) push(`/news/${encodeURIComponent(slug)}`);
  }

  for (const album of input.albums) {
    const id = album.id.trim();
    if (id) push(`/gallery/${encodeURIComponent(id)}`);
  }

  return paths;
}

/**
 * Sitemap metadata for a detail path. Returns `null` for anything it does not
 * recognise instead of guessing: a fallback would label a stray path as news
 * and quietly publish a wrong `changeFrequency`/`priority`.
 */
export function sitemapMetaFor(
  path: string
): { changeFrequency: "monthly"; priority: number } | null {
  if (path.startsWith("/news/")) return { changeFrequency: "monthly", priority: 0.6 };
  if (path.startsWith("/gallery/")) return { changeFrequency: "monthly", priority: 0.5 };
  return null;
}

/**
 * Serialise structured data for a `<script type="application/ld+json">` block.
 *
 * `JSON.stringify` leaves `</script>` intact, so a value containing it closes
 * the tag early and the rest of the payload becomes markup. Escaping `<` (and
 * the other two line separators JSON allows) keeps the data inert; the result
 * is still valid JSON because these are `\u` escapes.
 */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

export function buildSportsClubJsonLd(input: {
  name: string;
  description: string;
  url: string;
  logo?: string;
}): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "SportsClub",
    name: input.name,
    description: input.description,
    url: input.url,
    ...(input.logo ? { logo: input.logo } : {}),
  };
}
