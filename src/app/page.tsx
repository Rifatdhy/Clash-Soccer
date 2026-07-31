"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircle, ChevronDown, MapPin, Clock, Users } from "lucide-react";
import { getAlbums } from "@/lib/album-store";
import { getUpcomingMatches } from "@/lib/match-store";
import { getNews } from "@/lib/news-store";
import { getFaqs, getSettings } from "@/lib/settings-store";

function InstagramIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
import Section, { SectionTitle, SectionSubtitle } from "@/components/section";
import MatchCard from "@/components/match-card";
import NewsCard from "@/components/news-card";
import GalleryCard from "@/components/gallery-card";
import { formatDate, formatTime } from "@/lib/format";
import type { Match, NewsItem, FaqItem, Setting, Album } from "@/types";

function useRandomParticles(count: number) {
  const [particles, setParticles] = useState<{ left: string; top: string; duration: number; delay: number }[]>([]);

  useEffect(() => {
    setParticles(
      Array.from({ length: count }, () => ({
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        duration: 4 + Math.random() * 6,
        delay: Math.random() * 3,
      }))
    );
  }, [count]);

  return particles;
}

export default function Home() {
  const [latestAlbums, setLatestAlbums] = useState<Album[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [latestNews, setLatestNews] = useState<NewsItem[]>([]);
  const [faqPreview, setFaqPreview] = useState<FaqItem[]>([]);
  const [nextMatch, setNextMatch] = useState<Match | undefined>();
  const [settings, setSettings] = useState<Setting | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Call hooks unconditionally at the top level
  const particles = useRandomParticles(15);

  useEffect(() => {
    async function fetchData() {
      try {
        const [albums, upcoming, news, faqs, settingsData] = await Promise.all([
          getAlbums(),
          getUpcomingMatches(),
          getNews(),
          getFaqs(),
          getSettings(),
        ]);

        setLatestAlbums(albums.slice(0, 4));
        setUpcomingMatches(upcoming.slice(0, 3));
        setNextMatch(upcoming[0]);
        setLatestNews(news.slice(0, 3));
        setFaqPreview(faqs.filter((faq) => faq.question.trim() !== "").slice(0, 3));
        setSettings(settingsData);
      } catch (error) {
        console.error("Error loading homepage data:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  if (isLoading || !settings) {
    return (
      <div className="min-h-screen bg-charcoal flex items-center justify-center">
        <div className="text-secondary-text text-sm uppercase tracking-widest">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center justify-center px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-accent-subtle to-charcoal pointer-events-none" />
        {particles.length > 0 && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((p, i) => (
              <motion.div
                key={i}
                className="absolute w-0.5 h-0.5 rounded-full bg-primary-text/20"
                style={{ left: p.left, top: p.top }}
                animate={{ y: [0, -20, 0], opacity: [0.1, 0.4, 0.1] }}
                transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
              />
            ))}
          </div>
        )}
        <div className="relative z-10 text-center max-w-4xl mx-auto pt-16 md:pt-20">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tighter text-primary-text leading-[0.85] font-display uppercase">
              LESS TALK.
              <br />
              MORE
              <br />
              <span className="text-accent">FOOTBALL.</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="text-lg md:text-xl text-secondary-text mt-6 max-w-lg mx-auto"
          >
            {settings.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <Link
              href="/schedule"
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              Jadwal Pertandingan
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 px-8 py-3 border border-border text-primary-text text-sm font-medium uppercase tracking-widest hover:bg-elevated transition-colors"
            >
              Tentang Kami
            </Link>
          </motion.div>

          {nextMatch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8, ease: [0.32, 0.72, 0, 1] }}
              className="mt-16 inline-block"
            >
              <div className="border border-border bg-surface/50 backdrop-blur-sm px-6 py-4 md:px-10 md:py-5 text-left">
                <p className="text-xs uppercase tracking-[0.2em] text-secondary-text mb-2 font-display">
                  Next Match
                </p>
                <p className="text-lg md:text-2xl font-bold text-primary-text font-display">
                  {nextMatch.title}
                </p>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-sm text-secondary-text">
                  <span className="flex items-center gap-1.5">
                    <Clock size={13} />
                    {formatDate(nextMatch.date)}, {formatTime(nextMatch.time)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin size={13} />
                    {nextMatch.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users size={13} />
                    {nextMatch.slotsAvailable}/{nextMatch.slotsTotal}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 0.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <ChevronDown size={24} className="text-secondary-text animate-pulse" />
        </motion.div>
      </section>

      {/* Upcoming Match */}
      <Section id="schedule">
        <SectionTitle>Next Match</SectionTitle>
        <SectionSubtitle>Jangan lewatkan pertandingan berikutnya.</SectionSubtitle>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingMatches.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            href="/schedule"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-secondary-text hover:text-primary-text transition-colors"
          >
            View All Matches <ArrowRight size={14} />
          </Link>
        </motion.div>
      </Section>

      {/* About Preview */}
      <Section className="bg-surface border-y border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <SectionTitle className="text-left">Tentang Clash.Soccer</SectionTitle>
            <SectionSubtitle className="text-left">
              Komunitas mini soccer yang lahir dari kecintaan terhadap sepak bola.
            </SectionSubtitle>
            <p className="text-secondary-text leading-relaxed mt-6 max-w-lg">
              Clash.Soccer adalah komunitas mini soccer berbasis di Jakarta. Kami mengadakan
              pertandingan rutin setiap minggu, turnamen bulanan, dan berbagai event seru lainnya.
              Bergabunglah dengan kami dan rasakan semangat kompetisi yang sesungguhnya.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 mt-8 text-sm uppercase tracking-widest text-secondary-text hover:text-primary-text transition-colors"
            >
              Learn More <ArrowRight size={14} />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="aspect-[4/3] bg-black/40 border border-border rounded-sm overflow-hidden relative flex items-center justify-center p-6 md:p-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 pointer-events-none" />
            <Image
              src="/logo.png"
              alt="Clash Soccer Logo"
              width={260}
              height={390}
              priority
              className="relative block w-[190px] md:w-[270px] h-auto object-contain drop-shadow-[0_16px_36px_rgba(0,0,0,0.45)]"
            />
          </motion.div>
        </div>
      </Section>

      {/* Latest News */}
      <Section id="news">
        <SectionTitle>Latest News</SectionTitle>
        <SectionSubtitle>Berita dan pengumuman terbaru dari komunitas.</SectionSubtitle>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {latestNews.map((item, i) => (
            <NewsCard key={item.id} item={item} index={i} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            href="/news"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-secondary-text hover:text-primary-text transition-colors"
          >
            All News <ArrowRight size={14} />
          </Link>
        </motion.div>
      </Section>

      {/* Gallery Preview */}
      <Section className="bg-surface border-y border-border" id="gallery">
        <SectionTitle>Gallery</SectionTitle>
        <SectionSubtitle>Dokumentasi setiap momen pertandingan.</SectionSubtitle>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {latestAlbums.map((album, i) => (
            <GalleryCard key={album.id} album={album} index={i} />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            href="/gallery"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-secondary-text hover:text-primary-text transition-colors"
          >
            View All Albums <ArrowRight size={14} />
          </Link>
        </motion.div>
      </Section>

      {/* FAQ Preview */}
      <Section id="faq">
        <SectionTitle>FAQ</SectionTitle>
        <SectionSubtitle>Pertanyaan yang sering diajukan.</SectionSubtitle>
        <div className="mt-12 max-w-3xl mx-auto">
          {faqPreview.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
              className="border-b border-border py-6"
            >
              <h3 className="text-base md:text-lg font-semibold text-primary-text mb-2">
                {faq.question}
              </h3>
              <p className="text-sm text-secondary-text leading-relaxed">{faq.answer}</p>
            </motion.div>
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <Link
            href="/faq"
            className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-secondary-text hover:text-primary-text transition-colors"
          >
            View All FAQs <ArrowRight size={14} />
          </Link>
        </motion.div>
      </Section>

      {/* Contact Preview */}
      <Section className="bg-surface border-t border-border" id="contact">
        <div className="text-center max-w-2xl mx-auto">
          <SectionTitle>Get in Touch</SectionTitle>
          <SectionSubtitle>
            Punya pertanyaan atau ingin bergabung? Hubungi kami.
          </SectionSubtitle>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <a
              href={`https://wa.me/${settings.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
            >
              <MessageCircle size={16} />
              WhatsApp
            </a>
            <a
              href={`https://instagram.com/${settings.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-border text-primary-text text-sm font-medium uppercase tracking-widest hover:bg-elevated transition-colors"
            >
              <InstagramIcon size={16} />
              Instagram
            </a>
          </motion.div>
        </div>
      </Section>
    </>
  );
}