"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download } from "lucide-react";
import Card from "@/components/card";
import { getAllRsvp } from "@/lib/rsvp-store";
import { getMatches } from "@/lib/match-store";
import type { RsvpEntry, Match } from "@/types";

export default function AdminRSVP() {
  const [filterMatch, setFilterMatch] = useState("all");
  const [allRsvp, setAllRsvp] = useState<RsvpEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAllRsvp(), getMatches()])
      .then(([rsvps, matchList]) => {
        setAllRsvp(rsvps);
        setMatches(matchList);
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered = filterMatch === "all"
    ? allRsvp
    : allRsvp.filter((r) => r.matchId === filterMatch);

  const getMatchTitle = (matchId: string) =>
    matches.find((m) => m.id === matchId)?.title || "Unknown";

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text">RSVP</h1>
        <button
          onClick={() => {
            const csv = [
              ["Match", "Name", "WhatsApp", "Jersey Size", "Registered At"],
              ...filtered.flatMap((r) =>
                r.participants.map((p) => [
                  getMatchTitle(r.matchId),
                  p.name,
                  p.whatsapp,
                  p.jerseySize,
                  new Date(r.createdAt).toLocaleString("id-ID"),
                ])
              ),
            ]
              .map((row) => row.join(","))
              .join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "rsvp-data.csv";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-4 py-2 border border-border text-sm text-primary-text uppercase tracking-widest hover:bg-elevated transition-colors"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-secondary-text">Loading...</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-4">
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

          {filtered.length === 0 ? (
        <Card hover={false}>
          <div className="text-center py-12">
            <p className="text-secondary-text">Belum ada RSVP untuk pertandingan ini.</p>
          </div>
        </Card>
      ) : (
        <Card hover={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Match</th>
                  <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Name</th>
                  <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">WhatsApp</th>
                  <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Jersey</th>
                  <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((rsvp, i) =>
                  rsvp.participants.map((p, pi) => (
                    <motion.tr
                      key={`${rsvp.id}-${pi}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: (i + pi) * 0.02 }}
                      className="border-b border-border/50"
                    >
                      <td className="py-3 px-4 text-primary-text">{getMatchTitle(rsvp.matchId)}</td>
                      <td className="py-3 px-4 text-primary-text">{p.name}</td>
                      <td className="py-3 px-4 text-secondary-text">{p.whatsapp}</td>
                      <td className="py-3 px-4 text-secondary-text">{p.jerseySize}</td>
                      <td className="py-3 px-4 text-secondary-text">
                        {new Date(rsvp.createdAt).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="border-t border-border px-4 py-3 text-xs text-secondary-text">
            Total: {allRsvp.reduce((sum, r) => sum + r.participants.length, 0)} participants across {allRsvp.length} registrations
          </div>
          </Card>
          )}
        </>
      )}
    </div>
  );
}
