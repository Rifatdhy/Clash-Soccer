import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import NewsCard from "@/components/news-card";
import { EmptyState } from "@/components/content-state";
import { fetchNews } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "News — Clash.Soccer",
  description: "Berita, pengumuman, dan informasi terbaru dari komunitas Clash.Soccer.",
};

export default async function NewsPage() {
  const news = await fetchNews();

  return (
    <>
      <PageHeader
        title="News"
        subtitle="Berita, pengumuman, dan informasi terbaru dari komunitas Clash.Soccer."
      />

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.length === 0 ? (
            <EmptyState
              title="Belum ada berita"
              description="Berita dan pengumuman akan muncul di sini."
            />
          ) : (
            news.map((item, i) => <NewsCard key={item.id} item={item} index={i} />)
          )}
        </div>
      </Section>
    </>
  );
}
