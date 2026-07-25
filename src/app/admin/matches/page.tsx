"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, X } from "lucide-react";
import Card from "@/components/card";
import Badge from "@/components/badge";
import { formatDate, formatTime } from "@/lib/format";
import type { Match } from "@/types";
import { getMatches, createMatch, updateMatch, deleteMatch } from "@/lib/match-store";

export default function AdminMatches() {
  const [matchList, setMatchList] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [form, setForm] = useState({ title: "", date: "", time: "", location: "", slotsTotal: 20 });

  useEffect(() => {
    loadMatches();
  }, []);

  async function loadMatches() {
    try {
      const matches = await getMatches();
      setMatchList(matches);
    } catch (error) {
      console.error("Error loading matches:", error);
    } finally {
      setLoading(false);
    }
  }

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", date: "", time: "19:00", location: "", slotsTotal: 20 });
    setModalOpen(true);
  };

  const openEdit = (m: Match) => {
    setEditing(m);
    setForm({ title: m.title, date: m.date, time: m.time, location: m.location, slotsTotal: m.slotsTotal });
    setModalOpen(true);
  };

  async function handleSave() {
    try {
      if (editing) {
        await updateMatch(editing.id, { ...form, slotsAvailable: form.slotsTotal });
      } else {
        const newMatch = {
          id: `m${Date.now()}`,
          ...form,
          slotsAvailable: form.slotsTotal,
          status: "upcoming" as const,
        };
        await createMatch(newMatch);
      }
      await loadMatches();
      setModalOpen(false);
    } catch (error) {
      console.error("Error saving match:", error);
      alert("Gagal menyimpan match. Silakan coba lagi.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin ingin menghapus match ini?")) return;
    try {
      await deleteMatch(id);
      await loadMatches();
    } catch (error) {
      console.error("Error deleting match:", error);
      alert("Gagal menghapus match. Silakan coba lagi.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-secondary-text">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary-text">Matches</h1>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Add Match
        </button>
      </div>

      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Title</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Date</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Time</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Location</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Slots</th>
                <th className="text-left py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Status</th>
                <th className="text-right py-3 px-4 text-secondary-text font-medium uppercase tracking-wider text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {matchList.map((m, i) => (
                <motion.tr
                  key={m.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-b border-border/50 hover:bg-elevated/30 transition-colors"
                >
                  <td className="py-3 px-4 text-primary-text">{m.title}</td>
                  <td className="py-3 px-4 text-secondary-text">{formatDate(m.date)}</td>
                  <td className="py-3 px-4 text-secondary-text">{formatTime(m.time)}</td>
                  <td className="py-3 px-4 text-secondary-text">{m.location}</td>
                  <td className="py-3 px-4 text-secondary-text">{m.slotsAvailable}/{m.slotsTotal}</td>
                  <td className="py-3 px-4">
                    <Badge variant={m.status as "upcoming" | "ongoing" | "completed"}>{m.status === "upcoming" ? "Upcoming" : m.status === "ongoing" ? "Live" : "Completed"}</Badge>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(m)} className="p-1 text-secondary-text hover:text-accent transition-colors">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} className="p-1 text-secondary-text hover:text-accent transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/80 flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-surface border border-border w-full max-w-md p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-primary-text">
                  {editing ? "Edit Match" : "Add Match"}
                </h2>
                <button onClick={() => setModalOpen(false)} className="text-secondary-text hover:text-accent">
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Match Title <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Clash Weekly #50"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                      Date <span className="text-accent">*</span>
                    </label>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm({ ...form, date: e.target.value })}
                      className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text focus:outline-none focus:border-accent transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                      Time <span className="text-accent">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={form.time.split(':')[0] || '19'}
                        onChange={(e) => {
                          const mins = form.time.split(':')[1] || '00';
                          setForm({ ...form, time: `${e.target.value}:${mins}` });
                        }}
                        className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text focus:outline-none focus:border-accent transition-colors"
                      >
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return <option key={hour} value={hour}>{hour}</option>;
                        })}
                      </select>
                      <select
                        value={form.time.split(':')[1] || '00'}
                        onChange={(e) => {
                          const hours = form.time.split(':')[0] || '19';
                          setForm({ ...form, time: `${hours}:${e.target.value}` });
                        }}
                        className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text focus:outline-none focus:border-accent transition-colors"
                      >
                        {['00', '15', '30', '45'].map(min => (
                          <option key={min} value={min}>{min}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-secondary-text/60 mt-1.5">
                      Format 24 jam: Jam (00-23) : Menit
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Location <span className="text-accent">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lapangan A, Futsal XYZ"
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-widest text-secondary-text mb-2">
                    Total Slots <span className="text-accent">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="20"
                    value={form.slotsTotal}
                    onChange={(e) => setForm({ ...form, slotsTotal: parseInt(e.target.value) || 0 })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text/50 focus:outline-none focus:border-accent transition-colors"
                  />
                  <p className="text-xs text-secondary-text/60 mt-1.5">
                    Jumlah pemain yang bisa mendaftar untuk match ini
                  </p>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 py-3 border border-border text-secondary-text text-sm font-medium uppercase tracking-widest hover:bg-elevated transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.title || !form.date || !form.time || !form.location || form.slotsTotal < 1}
                  className="flex-1 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {editing ? "Update Match" : "Create Match"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
