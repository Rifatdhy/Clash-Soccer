import HomeView from "@/components/views/home-view";
import JsonLd from "@/components/json-ld";
import { fetchAlbums, fetchFaqs, fetchMatches, fetchNews, fetchSettings } from "@/lib/data";
import { pickNextMatch, sortByKickoff, splitMatchesByTiming } from "@/lib/match-groups";
import { buildSportsClubJsonLd, getSiteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [albums, matches, news, faqs, settings] = await Promise.all([
    fetchAlbums(),
    fetchMatches(),
    fetchNews(),
    fetchFaqs(),
    fetchSettings(),
  ]);

  const { current } = splitMatchesByTiming(matches);
  const nextMatch = pickNextMatch(current);
  // The query returns newest-first for the admin table; the public list needs
  // the soonest three, so the card grid matches the "Next Match" banner.
  const upcoming = sortByKickoff(current).slice(0, 3);

  const siteUrl = getSiteUrl();
  const logo = settings.logoUrl ? new URL(settings.logoUrl, siteUrl).toString() : undefined;

  return (
    <>
      <JsonLd
        data={buildSportsClubJsonLd({
          name: settings.communityName,
          description: settings.description,
          url: siteUrl,
          logo,
        })}
      />
      <HomeView
        settings={settings}
        nextMatch={nextMatch}
        upcomingMatches={upcoming}
        latestNews={news.slice(0, 3)}
        latestAlbums={albums.slice(0, 4)}
        faqPreview={faqs.filter((faq) => faq.question.trim() !== "").slice(0, 3)}
      />
    </>
  );
}
