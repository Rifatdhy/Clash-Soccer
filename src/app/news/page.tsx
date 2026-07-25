"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import NewsCard from "@/components/news-card";
import { getNews } from "@/lib/news-store";
import { type NewsItem } from "@/data/mock";

export default function NewsPage() {
  const [page, setPage] = useState(1);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const perPage = 6;

  useEffect(() => {
    getNews().then(setNews);
  }, []);

  if (!news) return null;

  return (
    <>
      <PageHeader
        title="News"
        subtitle="Berita, pengumuman, dan informasi terbaru dari komunitas Clash.Soccer."
      />

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((item, i) => (
            <NewsCard key={item.id} item={item} index={i} />
          ))}
        </div>
      </Section>
    </>
  );
}
