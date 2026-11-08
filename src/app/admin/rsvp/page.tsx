"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Download, Trash2, ArrowLeft, Users } from "lucide-react";
import Card from "@/components/card";
import { deleteRsvp, getAllRsvp } from "@/lib/rsvp-store";
import { getMatches } from "@/lib/match-store";
import type { RsvpEntry, Match } from "@/types";

function csvEscape(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

export default function AdminRSVP() {
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [allRsvp, setAllRsvp] = useState<RsvpEntry[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rsvps, matchList] = await Promise.all([getAllRsvp(), getMatches()]);
      setAllRsvp(rsvps);
      setMatches(matchList);
    } catch (err) {
      console.error("Error loading RSVP data:", err);
      setError("Gagal memuat data RSVP.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeMatch = matches.find((m) => m.id === selectedMatchId);
  const filteredRsvps = selectedMatchId
    ? allRsvp.filter((r) => r.matchId === selectedMatchId)
    : [];

  const getMatchTitle = (matchId: string) =>
    matches.find((m) => m.id === matchId)?.title || "Unknown";

  const getParticipantCount = (matchId: string) => {
    return allRsvp
      .filter((r) => r.matchId === matchId)
      .reduce((sum, r) => sum + r.participants.length, 0);
  };

  const exportCsv = () => {
    if (!selectedMatchId || !activeMatch) return;

    const csv = [
      ["Match", "Name", "WhatsApp", "Jersey Size", "Registered At"],
      ...filteredRsvps.flatMap((r) =>
        r.participants.map((p) => [
          activeMatch.title,
          p.name,
          p.whatsapp,
          p.jerseySize,
          new Date(r.createdAt).toLocaleString("id-ID"),
        ])
      ),
    ]
      .map((row) => row.map(csvEscape).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rsvp-${activeMatch.title.toLowerCase().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (rsvp: RsvpEntry) => {
    const totalParticipants = rsvp.participants.length;
    const confirmed = window.confirm(
      `Hapus RSVP untuk ${getMatchTitle(rsvp.matchId)} (${totalParticipants} peserta)? Slot match akan dikembalikan.`
    );

    if (!confirmed) return;

    setDeletingId(rsvp.id);
    try {
      await deleteRsvp(rsvp.id);
      setAllRsvp((current) => current.filter((item) => item.id !== rsvp.id));
    } catch (error) {
      console.error(error);
      setError("Gagal menghapus RSVP. Silakan coba lagi.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text">
            RSVP Management
          </h1>
          <p className="text-sm text-secondary-text mt-1">
            {selectedMatchId 
              ? `Mengelola pendaftar untuk pertandingan: ${activeMatch?.title}`
              : "Pilih pertandingan terlebih dahulu untuk melihat dan mengelola data pendaftar RSVP."}
          </p>
        </div>
        {selectedMatchId && filteredRsvps.length > 0 && (
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-4 py-2 border border-border text-sm text-primary-text uppercase tracking-widest hover:bg-elevated transition-colors"
          >
            <Download size={16} /> Export CSV
          </button>
        )}
      </div>

      {error && (
        <div role="alert" className="mb-6 p-4 border border-red-500/20 bg-red-500/10 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <p className="text-secondary-text">Loading...</p>
        </div>
      ) : (
        <>
          {!selectedMatchId ? (
            /* Match List View */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {matches.map((m) => {
                const rsvpCount = getParticipantCount(m.id);
                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex"
                  >
                    <button
                      onClick={() => setSelectedMatchId(m.id)}
                      className="w-full text-left bg-elevated border border-border p-5 hover:border-accent transition-all duration-200 group flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 border ${
                            m.status === "upcoming" 
                              ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/5" 
                              : "border-border text-secondary-text bg-border/5"
                          }`}>
                            {m.status}
                          </span>
                          <span className="text-xs text-secondary-text">
                            {new Date(m.date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-primary-text mb-2 group-hover:text-accent transition-colors">
                          {m.title}
                        </h3>
                        <p className="text-xs text-secondary-text mb-4">
                          {m.location} • {m.time}
                        </p>
                      </div>
                      <div className="flex items-center justify-between border-t border-border/50 pt-4 mt-auto w-full">
                        <div className="flex items-center gap-1.5 text-xs text-secondary-text">
                          <Users size={14} className="text-accent" />
                          <span>Total Pendaftaran:</span>
                        </div>
                        <span className="text-sm font-semibold text-primary-text">
                          {rsvpCount} Peserta ({m.slotsTotal - m.slotsAvailable}/{m.slotsTotal} Slot)
                        </span>
                      </div>
                    </button>
                  </motion.div>
                );
              })}
              {matches.length === 0 && (
                <div className="col-span-full">
                  <Card hover={false}>
                    <div className="text-center py-12">
                      <p className="text-secondary-text">Belum ada data pertandingan.</p>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ) : (
            /* RSVP Table View for Selected Match */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
            >
              <button
                onClick={() => setSelectedMatchId(null)}
                className="flex items-center gap-2 px-3 py-1.5 border border-border text-xs text-primary-text hover:bg-elevated transition-colors mb-6 uppercase tracking-wider"
              >
                <ArrowLeft size={14} /> Kembali ke Daftar Match
              </button>

              {filteredRsvps.length === 0 ? (
                <Card hover={false}>
                  <div className="text-center py-12">
                    <p className="text-secondary-text">
                      Belum ada RSVP untuk pertandingan <strong>{activeMatch?.title}</strong>.
                    </p>
                  </div>
                </Card>
              ) : (
                <Card hover={false} className="overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Name</th>
                          <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">WhatsApp</th>
                          <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Jersey</th>
                          <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Registered</th>
                          <th className="text-right py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRsvps.map((rsvp, i) =>
                          rsvp.participants.map((p, pi) => (
                            <motion.tr
                              key={`${rsvp.id}-${pi}`}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: (i + pi) * 0.01 }}
                              className="border-b border-border/50 hover:bg-elevated/20"
                            >
                              <td className="py-3 px-4 text-primary-text font-medium">{p.name}</td>
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
                              <td className="py-3 px-4 text-right">
                                {pi === 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleDelete(rsvp)}
                                    disabled={deletingId === rsvp.id}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 border border-red-500/30 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50 transition-colors"
                                  >
                                    <Trash2 size={14} />
                                    {deletingId === rsvp.id ? "Deleting..." : "Delete RSVP"}
                                  </button>
                                )}
                              </td>
                            </motion.tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  <div className="border-t border-border px-4 py-3 text-xs text-secondary-text flex justify-between items-center bg-elevated/10">
                    <div>
                      Total: {filteredRsvps.reduce((sum, r) => sum + r.participants.length, 0)} participants across {filteredRsvps.length} registrations
                    </div>
                    <div>
                      Match: {activeMatch?.title}
                    </div>
                  </div>
                </Card>
              )}
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}