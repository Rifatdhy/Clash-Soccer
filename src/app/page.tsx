import HomeView from "@/components/views/home-view";
import { fetchAlbums, fetchFaqs, fetchMatches, fetchNews, fetchSettings } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [albums, matches, news, faqs, settings] = await Promise.all([
    fetchAlbums(),
    fetchMatches(),
    fetchNews(),
    fetchFaqs(),
    fetchSettings(),
  ]);

  const upcomingMatches = matches.filter((match) => match.status === "upcoming");

  return (
    <HomeView
      settings={settings}
      nextMatch={upcomingMatches[0]}
      upcomingMatches={upcomingMatches.slice(0, 3)}
      latestNews={news.slice(0, 3)}
      latestAlbums={albums.slice(0, 4)}
      faqPreview={faqs.filter((faq) => faq.question.trim() !== "").slice(0, 3)}
    />
  );
}
