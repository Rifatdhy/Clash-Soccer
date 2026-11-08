import type { Metadata } from "next";
import { notFound } from "next/navigation";
import NewsDetailView from "@/components/views/news-detail-view";
import { fetchNewsBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await fetchNewsBySlug(slug);
  if (!article) return { title: "Article not found — Clash.Soccer" };

  return {
    title: `${article.title} — Clash.Soccer`,
    description: article.excerpt || article.content.slice(0, 160),
    openGraph: {
      title: article.title,
      description: article.excerpt || article.content.slice(0, 160),
      images: article.coverImage ? [article.coverImage] : undefined,
    },
  };
}

export default async function NewsDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const article = await fetchNewsBySlug(slug);
  if (!article) notFound();

  return <NewsDetailView article={article} />;
}
