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
