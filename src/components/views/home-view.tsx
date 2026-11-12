"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown } from "lucide-react";
import Section from "@/components/section";
import { SectionLabel } from "@/components/section-label";
import MatchCard from "@/components/match-card";
import NewsCard from "@/components/news-card";
import GalleryCard from "@/components/gallery-card";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import { formatDate, formatTime } from "@/lib/format";
import type { Match, NewsItem, FaqItem, Setting, Album } from "@/types";
import MobileNextGameBar from "@/components/mobile-next-game-bar";

interface HomeViewProps {
  settings: Setting;
  nextMatch?: Match;
  upcomingMatches: Match[];
  latestNews: NewsItem[];
  latestAlbums: Album[];
  faqPreview: FaqItem[];
}

export default function HomeView({
  settings,
  nextMatch,
  upcomingMatches,
  latestNews,
  latestAlbums,
  faqPreview,
}: HomeViewProps) {
  return (
    <>
      {/* Hero */}
      <section data-home-hero className="relative overflow-hidden border-b border-border bg-charcoal">
        <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-7xl items-end gap-12 px-5 pb-12 pt-28 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-16 md:px-8 md:pb-20 md:pt-32">
          <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
          >
            <p className="mb-6 flex items-center gap-3 font-condensed text-xs uppercase tracking-[0.28em] text-secondary-text">
              <span className="h-px w-10 bg-crest" />
              Depok · Est. 2024
            </p>
            <h1 className="display-balance max-w-4xl font-statement text-6xl leading-[0.86] tracking-[-0.04em] text-primary-text sm:text-8xl md:text-9xl">
              The game is
              <br />
              <em className="text-crest">better together.</em>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="mt-8 max-w-md text-base leading-relaxed text-secondary-text md:text-lg"
          >
            {settings.description}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="mt-10 flex flex-col items-start gap-4 sm:flex-row"
          >
            <Link
              href="/schedule"
              className="inline-flex items-center gap-3 bg-crest px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-bone transition-colors hover:bg-crest-hover"
            >
              Find your next game
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-3 border border-primary-text/30 px-6 py-4 text-sm font-semibold uppercase tracking-[0.14em] text-primary-text transition-colors hover:bg-primary-text hover:text-bone"
            >
              Our story
            </Link>
          </motion.div>

          </div>
          <div className="relative flex min-h-[22rem] items-end md:min-h-[32rem]">
            <div className="relative z-10 ml-auto w-full max-w-md rounded-3xl border border-ink-line/50 bg-ink p-7 text-bone shadow-[0_24px_60px_rgba(0,0,0,0.16)] md:p-10">
              <div className="mb-14 flex items-center justify-between font-condensed text-xs uppercase tracking-[0.2em] text-bone-dim">
                <span>Clash / Next show</span><span>Next up</span>
              </div>
              <p className="mb-3 font-condensed text-xs uppercase tracking-[0.2em] text-crest-ink">The next kick-off</p>
              {nextMatch ? (
                <>
                  <p className="font-statement text-4xl leading-none md:text-5xl">{nextMatch.title}</p>
                   <div className="mt-8 grid grid-cols-2 gap-4 border-t border-ink-line pt-5 font-condensed text-sm uppercase tracking-[0.12em] text-bone-dim">
                     <span>{formatDate(nextMatch.date)}<br /><strong className="text-bone">{formatTime(nextMatch.time)}</strong></span>
                     <span>{nextMatch.location}<br /><strong className="text-bone">{nextMatch.slotsAvailable > 0 ? `${nextMatch.slotsAvailable} spots left` : "Fully booked"}</strong></span>
                   </div>
                   <Link href={`/schedule/${nextMatch.id}`} className="mt-7 inline-flex items-center gap-2 font-condensed text-xs uppercase tracking-[0.18em] text-crest-ink hover:text-bone">{nextMatch.slotsAvailable > 0 ? "Join this game" : "View fixture"} <ArrowRight size={14} /></Link>
                 </>
               ) : <><p className="font-statement text-4xl">No fixture yet.</p><Link href="/schedule" className="mt-7 inline-flex items-center gap-2 font-condensed text-xs uppercase tracking-[0.18em] text-crest-ink hover:text-bone">See the schedule <ArrowRight size={14} /></Link></>}
            </div>
          </div>
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

      <section aria-label="Clash Soccer activity" className="border-b border-border bg-ink text-bone">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-ink-line px-5 sm:grid-cols-4 sm:divide-y-0 md:px-8">
          {[
            ["Weekly rhythm", "Wednesday + Saturday"],
            ["Home ground", "Depok"],
            ["Who can play", "All levels welcome"],
            ["Match size", nextMatch ? `${nextMatch.slotsTotal} players` : "Open games"],
          ].map(([label, value]) => (
            <div key={label} className="px-4 py-5 first:pl-0 sm:px-6 sm:py-7 sm:first:pl-0">
              <p className="font-condensed text-[10px] uppercase tracking-[0.2em] text-bone-dim">{label}</p>
              <p className="mt-2 font-display text-sm text-bone sm:text-base">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Upcoming Match */}
      <Section id="schedule" data-home-schedule className="section-rule">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><SectionLabel>On the calendar</SectionLabel><h2 className="mt-5 max-w-xl font-statement text-4xl leading-none text-primary-text md:text-6xl">Show up. Play hard. Leave with a story.</h2></div>
          <Link href="/schedule" className="inline-flex items-center gap-2 font-condensed text-sm uppercase tracking-[0.16em] text-secondary-text hover:text-crest">Full schedule <ArrowRight size={14} /></Link>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {upcomingMatches.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} />
          ))}
        </div>
      </Section>

      {nextMatch && <MobileNextGameBar match={nextMatch} />}

      {/* About Preview */}
      <Section className="bg-surface border-y border-border">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <SectionLabel>Our football community</SectionLabel>
            <p className="text-secondary-text leading-relaxed mt-6 max-w-lg">
              Clash.Soccer adalah komunitas mini soccer berbasis di Jakarta. Kami bermain rutin setiap minggu,
              membuka ruang untuk pemain baru, dan selalu menyisakan tempat untuk satu pertandingan lagi.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 mt-8 text-sm uppercase tracking-widest text-secondary-text hover:text-primary-text transition-colors"
            >
              Meet the community <ArrowRight size={14} />
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="aspect-[4/3] bg-ink border border-ink-line rounded-sm overflow-hidden relative flex items-center justify-center p-6 md:p-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 pointer-events-none" />
            <div className="relative flex flex-col items-center gap-5 text-center text-bone">
              <Image src="/logo.png" alt="Clash Soccer" width={1024} height={1536} className="h-auto max-h-[320px] w-auto max-w-[220px] object-contain md:max-h-[380px] md:max-w-[270px]" />
            </div>
          </motion.div>
        </div>
      </Section>

      <Section className="bg-ink text-bone">
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr] md:items-end">
          <div>
            <SectionLabel>How it works</SectionLabel>
            <h2 className="mt-5 max-w-sm font-statement text-5xl leading-[0.9] text-bone md:text-6xl">No trial. Just show up.</h2>
          </div>
          <div className="grid gap-0 border-t border-ink-line sm:grid-cols-3">
            {[['01', 'Pilih pertandingan', 'Cari jadwal yang cocok buatmu.'], ['02', 'Isi RSVP', 'Amankan tempat sebelum penuh.'], ['03', 'Datang dan main', 'Bawa sepatu. Sisanya kami urus.']].map(([number, title, text]) => (
              <div key={number} className="border-b border-ink-line py-6 sm:border-b-0 sm:border-r sm:px-6 sm:first:pl-0 sm:last:border-r-0">
                <p className="font-condensed text-xs tracking-[0.2em] text-crest-ink">{number}</p>
                <h3 className="mt-8 font-display text-lg text-bone">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-bone-dim">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Latest News */}
      <Section id="news">
        <SectionLabel>From the pitch</SectionLabel>
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
            Read from the pitch <ArrowRight size={14} />
          </Link>
        </motion.div>
      </Section>

      {/* Gallery Preview */}
      <Section className="bg-surface border-y border-border" id="gallery">
        <SectionLabel>The Clash archive</SectionLabel>
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
            Open the archive <ArrowRight size={14} />
          </Link>
        </motion.div>
      </Section>

      {/* FAQ Preview */}
      <Section id="faq">
        <SectionLabel>FAQ</SectionLabel>
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
          <SectionLabel>Keep up with Clash</SectionLabel>
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
              className="inline-flex items-center gap-2 rounded-full bg-accent px-8 py-3 text-sm font-medium uppercase tracking-widest text-charcoal transition-all hover:bg-crest-hover hover:shadow-[0_8px_18px_rgba(127,29,50,0.22)]"
            >
              <WhatsAppIcon size={18} />
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
