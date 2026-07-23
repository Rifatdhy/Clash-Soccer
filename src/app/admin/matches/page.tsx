"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, X } from "lucide-react";
import Card from "@/components/card";
import Badge from "@/components/badge";
import { formatDate, formatTime } from "@/data/mock";
import { type Match } from "@/data/mock";
import { getMatches, createMatch, updateMatch as updateMatchStore, deleteMatch } from "@/lib/match-store";

export default function AdminMatches() {
  const [matchList, setMatchList] = useState<Match[] | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Match | null>(null);
  const [form, setForm] = useState({ title: "", date: "", time: "", location: "", slotsTotal: 20 });

  useEffect(() => {
    setMatchList(getMatches());
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm({ title: "", date: "", time: "", location: "", slotsTotal: 20 });
    setModalOpen(true);
  };

  const openEdit = (m: Match) => {
    setEditing(m);
    setForm({ title: m.title, date: m.date, time: m.time, location: m.location, slotsTotal: m.slotsTotal });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (editing) {
      setMatchList(updateMatchStore(editing.id, { ...form, slotsAvailable: form.slotsTotal }));
    } else {
      const newMatch: Match = {
        id: `m${Date.now()}`,
        ...form,
        slotsAvailable: form.slotsTotal,
        status: "upcoming",
      };
      setMatchList(createMatch(newMatch));
    }
    setModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setMatchList(deleteMatch(id));
  };

  if (!matchList) return null;

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
                <input
                  type="text"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                />
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text focus:outline-none focus:border-accent"
                />
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text focus:outline-none focus:border-accent"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text placeholder:text-secondary-text focus:outline-none focus:border-accent"
                />
                <input
                  type="number"
                  placeholder="Total Slots"
                  value={form.slotsTotal}
                  onChange={(e) => setForm({ ...form, slotsTotal: parseInt(e.target.value) || 0 })}
                  className="w-full bg-elevated border border-border px-4 py-3 text-sm text-primary-text focus:outline-none focus:border-accent"
                />
              </div>

              <button
                onClick={handleSave}
                className="w-full mt-6 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity"
              >
                {editing ? "Update" : "Create"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
