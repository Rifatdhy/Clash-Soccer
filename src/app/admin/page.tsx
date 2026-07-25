"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Card from "@/components/card";
import { getMatches } from "@/lib/match-store";
import { getNews } from "@/lib/news-store";
import { getAlbums } from "@/lib/album-store";
import { getRsvps } from "@/lib/rsvp-store";
import { Calendar, Users, Image, Newspaper } from "lucide-react";
import type { Match, NewsItem, Album, RsvpEntry } from "@/types";

export default function AdminDashboard() {
  const [albumCount, setAlbumCount] = useState(0);
  const [matches, setMatches] = useState<Match[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [rsvps, setRsvps] = useState<RsvpEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [matchesData, newsData, albumsData, rsvpsData] = await Promise.all([
          getMatches(),
          getNews(),
          getAlbums(),
          getRsvps(),
        ]);
        setMatches(matchesData);
        setNews(newsData);
        setAlbumCount(albumsData.length);
        setRsvps(rsvpsData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
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

  const totalParticipants = rsvps.reduce((sum, r) => {
    try {
      const participants = typeof r.participants === 'string' 
        ? JSON.parse(r.participants) 
        : r.participants;
      return sum + (Array.isArray(participants) ? participants.length : 0);
    } catch {
      return sum;
    }
  }, 0);

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
      icon: Image,
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
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.08, ease: [0.32, 0.72, 0, 1] }}
          >
            <Card hover={false}>
              <stat.icon size={24} className={stat.color} />
              <p className="text-3xl font-bold text-primary-text mt-4">{stat.value}</p>
              <p className="text-sm text-secondary-text mt-1">{stat.label}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-12">
        <h2 className="text-lg font-semibold text-primary-text mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
              className="block p-4 bg-elevated border border-border text-sm text-primary-text hover:bg-surface transition-colors"
            >
              {action.label}
            </motion.a>
          ))}
        </div>
      </div>
    </div>
  );
}
