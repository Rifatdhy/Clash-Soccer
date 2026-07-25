"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Share2 } from "lucide-react";
import Link from "next/link";
import Section from "@/components/section";
import { getNewsBySlug } from "@/lib/news-store";
import { formatDate, type NewsItem } from "@/data/mock";

export default function NewsDetailPage() {
  const params = useParams();
  const [article, setArticle] = useState<NewsItem | undefined>();

  useEffect(() => {
    getNewsBySlug(params.slug as string).then(setArticle);
  }, [params.slug]);

  if (!article) {
    return (
      <Section>
        <p className="text-secondary-text">Article not found.</p>
        <Link href="/news" className="text-accent mt-4 inline-block">Back to News</Link>
      </Section>
    );
  }

  return (
    <>
      <div className="pt-32 md:pt-40 pb-12 md:pb-20 px-4 border-b border-border">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-secondary-text hover:text-accent transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to News
          </Link>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-primary-text leading-tight"
          >
            {article.title}
          </motion.h1>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex items-center gap-4 mt-6 text-sm text-secondary-text"
          >
            <span>{formatDate(article.date)}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Clash.Soccer</span>
          </motion.div>
        </div>
      </div>

      <Section>
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="aspect-[16/9] bg-elevated border border-border mb-12 overflow-hidden"
          >
            {article.coverImage ? (
              <img 
                src={article.coverImage} 
                alt={article.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="prose prose-invert max-w-none"
          >
            <p className="text-lg text-primary-text leading-relaxed mb-6">{article.excerpt}</p>
            {article.content.split(". ").map((sentence, i) => (
              <p key={i} className="text-secondary-text leading-relaxed mb-4">
                {sentence}.
              </p>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-12 pt-8 border-t border-border flex items-center gap-4"
          >
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${article.title} — Clash.Soccer`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-secondary-text hover:text-accent transition-colors"
            >
              <Share2 size={16} /> Share via WhatsApp
            </a>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
