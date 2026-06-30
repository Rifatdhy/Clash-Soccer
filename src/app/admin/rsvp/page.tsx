"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, ChevronDown, ChevronUp } from "lucide-react";
import Card from "@/components/card";
import { matches, rsvpData, formatDate } from "@/data/mock";

export default function AdminRSVP() {
  const [filterMatch, setFilterMatch] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filterMatch === "all"
    ? rsvpData
    : rsvpData.filter((r) => r.matchId === filterMatch);

  const getMatchTitle = (matchId: string) =>
    matches.find((m) => m.id === matchId)?.title || "Unknown";

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text">RSVP</h1>
        <button className="flex items-center gap-2 px-4 py-2 border border-border text-sm text-primary-text uppercase tracking-widest hover:bg-elevated transition-colors">
          <Download size={16} /> Export Excel
        </button>
      </div>

      <div className="mb-6">
        <select
          value={filterMatch}
          onChange={(e) => setFilterMatch(e.target.value)}
          className="bg-elevated border border-border px-4 py-2.5 text-sm text-primary-text focus:outline-none focus:border-accent"
        >
          <option value="all">All Matches</option>
          {matches.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
        </select>
      </div>

      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Match</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Participants</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Date Registered</th>
                <th className="text-right py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rsvp, i) => (
                <motion.tr
                  key={rsvp.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50"
                >
                  <td className="py-3 px-4 text-primary-text">{getMatchTitle(rsvp.matchId)}</td>
                  <td className="py-3 px-4 text-secondary-text">{rsvp.participants.length}</td>
                  <td className="py-3 px-4 text-secondary-text">{formatDate("2026-06-20")}</td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => setExpanded(expanded === rsvp.id ? null : rsvp.id)}
                      className="text-secondary-text hover:text-accent transition-colors"
                    >
                      {expanded === rsvp.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
