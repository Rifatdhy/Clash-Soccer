"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "@/components/card";
import { getMatches } from "@/lib/match-store";
import { getNews } from "@/lib/news-store";
import { getAlbums } from "@/lib/album-store";
import { getAllRsvp } from "@/lib/rsvp-store";
import { Calendar, Users, Newspaper, ImageIcon } from "lucide-react";
import type { Match, NewsItem, RsvpEntry } from "@/types";

export default function AdminDashboard() {
  const [albumCount, setAlbumCount] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchesData, newsData, albumsData, rsvpsData] = await Promise.all([
          getMatches(),
          getNews(),
          getAlbums(),
          getAllRsvp(),
        ]);
        setMatches(matchesData);
        setNews(newsData);
        setAlbumCount(albumsData.length);
        setRsvps(rsvpsData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Gagal memuat ringkasan dashboard."
        );
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-secondary-text">Loading...</p>
      </div>
    );
  }

  const totalParticipants = rsvps.reduce(
    (sum, r) => sum + r.participants.length,
    0
  );

  const stats = [
    {
      icon: Calendar,
      label: "Matches",
      value: matches.length,
      color: "text-accent",
    },
    {
      icon: Users,
      label: "Total Participants",
      value: totalParticipants,
      color: "text-accent",
    },
    {
      icon: ImageIcon,
      label: "Albums",
      value: albumCount,
      color: "text-accent",
    },
    {
      icon: Newspaper,
      label: "News Articles",
      value: news.length,
      color: "text-accent",
    },
  ];

  return (
    <div className="space-y-8 md:space-y-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-secondary-text">
            Ringkasan singkat aktivitas admin
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="p-4 border border-red-500/20 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 md:gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: [0.32, 0.72, 0, 1] }}
          >
            <Card
              hover={false}
              className="rounded-2xl p-4 md:p-6 shadow-none"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-black/20">
                  <stat.icon size={20} className={stat.color} />
                </div>
                <div>
                  <p className="text-2xl md:text-3xl font-bold text-primary-text leading-none">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-sm text-secondary-text">{stat.label}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-primary-text">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Add Match", href: "/admin/matches" },
            { label: "View RSVPs", href: "/admin/rsvp" },
            { label: "Create Album", href: "/admin/gallery" },
            { label: "Write News", href: "/admin/news" },
            { label: "Update Settings", href: "/admin/settings" },
          ].map((action, i) => (
            <motion.a
              key={action.label}
              href={action.href}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.25 + i * 0.05 }}
              className="flex items-center rounded-xl border border-border bg-elevated px-4 py-3 text-sm font-medium text-primary-text transition-colors hover:bg-surface"
            >
              {action.label}
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
