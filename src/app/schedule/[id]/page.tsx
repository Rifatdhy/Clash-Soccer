"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import Card from "@/components/card";
import Badge from "@/components/badge";
import { matches, formatDate, formatTime } from "@/data/mock";

interface Participant {
  name: string;
  whatsapp: string;
  jerseySize: string;
}

export default function MatchDetailPage() {
  const params = useParams();
  const match = matches.find((m) => m.id === params.id);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [form, setForm] = useState({ name: "", whatsapp: "", jerseySize: "M" });
  const [submitted, setSubmitted] = useState(false);

  if (!match) {
    return (
      <Section>
        <p className="text-secondary-text">Match not found.</p>
        <Link href="/schedule" className="text-accent mt-4 inline-block">Back to Schedule</Link>
      </Section>
    );
  }

  const addParticipant = () => {
    if (!form.name || !form.whatsapp) return;
    setParticipants([...participants, { ...form }]);
    setForm({ name: "", whatsapp: "", jerseySize: "M" });
  };

  const removeParticipant = (i: number) => {
    setParticipants(participants.filter((_, idx) => idx !== i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (participants.length === 0) return;
    setSubmitted(true);
  };

  return (
    <>
      <PageHeader
        title={match.title}
        subtitle={`${formatDate(match.date)} — ${match.location}`}
      />

      <Section>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-secondary-text hover:text-accent transition-colors mb-12"
        >
          <ArrowLeft size={14} /> Back to Schedule
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          >
            <Card hover={false}>
              <Badge variant={match.status} className="mb-6">{match.status === "upcoming" ? "Upcoming" : match.status === "ongoing" ? "Live" : "Completed"}</Badge>
              <h2 className="text-2xl font-bold text-primary-text mb-8">Match Details</h2>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-secondary-text">
                  <Clock size={18} />
                  <span>{formatDate(match.date)} — {formatTime(match.time)}</span>
                </div>
                <div className="flex items-center gap-3 text-secondary-text">
                  <MapPin size={18} />
                  <span>{match.location}</span>
                </div>
                <div className="flex items-center gap-3 text-secondary-text">
                  <Users size={18} />
                  <span>{match.slotsAvailable}/{match.slotsTotal} slots available</span>
                </div>
              </div>
            </Card>
          </motion.div>

          {match.status === "upcoming" && !submitted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: [0.32, 0.72, 0, 1] }}
            >
              <Card hover={false}>
                <h2 className="text-2xl font-bold text-primary-text mb-6">RSVP</h2>

                <div className="space-y-4 mb-6">
                  <input
                    type="text"
                    placeholder="Nama"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-primary-text text-sm placeholder:text-secondary-text focus:outline-none focus:border-accent transition-colors"
                  />
                  <input
                    type="tel"
                    placeholder="No WhatsApp"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-primary-text text-sm placeholder:text-secondary-text focus:outline-none focus:border-accent transition-colors"
                  />
                  <select
                    value={form.jerseySize}
                    onChange={(e) => setForm({ ...form, jerseySize: e.target.value })}
                    className="w-full bg-elevated border border-border px-4 py-3 text-primary-text text-sm focus:outline-none focus:border-accent transition-colors"
                  >
                    <option value="S">Jersey Size: S</option>
                    <option value="M">Jersey Size: M</option>
                    <option value="L">Jersey Size: L</option>
                    <option value="XL">Jersey Size: XL</option>
                  </select>

                  <button
                    onClick={addParticipant}
                    className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border text-sm text-secondary-text hover:border-accent hover:text-accent transition-colors"
                  >
                    <Plus size={16} /> Tambah Peserta
                  </button>
                </div>

                {participants.length > 0 && (
                  <div className="mb-6 space-y-2">
                    <p className="text-xs uppercase tracking-widest text-secondary-text mb-3">
                      Participants ({participants.length})
                    </p>
                    {participants.map((p, i) => (
                      <div key={i} className="flex items-center justify-between bg-elevated px-4 py-2">
                        <div>
                          <span className="text-sm text-primary-text">{p.name}</span>
                          <span className="text-xs text-secondary-text ml-3">{p.jerseySize}</span>
                        </div>
                        <button onClick={() => removeParticipant(i)} className="text-secondary-text hover:text-accent transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={participants.length === 0}
                  className="w-full py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  Submit RSVP
                </button>
              </Card>
            </motion.div>
          )}

          {submitted && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            >
              <Card hover={false}>
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full border-2 border-accent flex items-center justify-center mx-auto mb-6">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-primary-text mb-2">RSVP Submitted!</h2>
                  <p className="text-secondary-text">
                    {participants.length} participant{participants.length > 1 ? "s" : ""} registered.
                  </p>
                  <p className="text-secondary-text text-sm mt-2">
                    Kami akan mengirimkan detail pertandingan ke WhatsApp Anda.
                  </p>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </Section>
    </>
  );
}
