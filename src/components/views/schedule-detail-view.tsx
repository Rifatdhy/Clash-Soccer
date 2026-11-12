"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, ArrowLeft, Plus, Trash2, CheckCircle2, Ticket, ArrowRight } from "lucide-react";
import Link from "next/link";
import Section from "@/components/section";
import Badge from "@/components/badge";
import { formatDate, formatTime } from "@/lib/format";
import { addRsvp } from "@/lib/rsvp-store";
import type { Participant, Match } from "@/types";

export default function ScheduleDetailView({ match }: { match: Match }) {
  const [current, setCurrent] = useState(match);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [form, setForm] = useState({ name: "", whatsapp: "", jerseySize: "M" });
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remainingSlots = current.slotsAvailable;
  const registeredCount = current.slotsTotal - current.slotsAvailable;

  const addParticipant = () => {
    if (!form.name.trim() || !form.whatsapp.trim()) return;
    if (participants.length >= remainingSlots) return;
    setParticipants([...participants, { ...form }]);
    setForm({ name: "", whatsapp: "", jerseySize: "M" });
  };

  const removeParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    if (participants.length === 0 || !current) return;
    if (participants.length > remainingSlots) {
      setSubmitError("Slot yang tersisa tidak mencukupi.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addRsvp(current.id, participants);
      setCurrent({
        ...current,
        slotsAvailable: Math.max(0, current.slotsAvailable - participants.length),
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Gagal mengirim RSVP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section>
      <div className="max-w-6xl mx-auto">
        <Link
          href="/schedule"
          className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-secondary-text hover:text-primary-text transition-colors mb-8"
        >
          <ArrowLeft size={14} /> Back to Schedule
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
          className="border border-border bg-surface/80 overflow-hidden"
        >
          <div className="px-6 md:px-8 py-5 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3">
              <Badge variant={current.status}>
                {current.status === "upcoming" ? "Upcoming" : current.status === "ongoing" ? "Live" : "Completed"}
              </Badge>
                <span className="text-xs uppercase tracking-[0.24em] text-secondary-text">
                 {current.status === "upcoming" ? "Next game" : "Match detail"}
              </span>
            </div>

            <div className="text-sm text-secondary-text">
              {formatDate(current.date)} • {formatTime(current.time)} • {current.location}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12">
            <div className="lg:col-span-7 border-b lg:border-b-0 lg:border-r border-border p-6 md:p-8">
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.26em] text-secondary-text mb-3">
                    Match Details
                  </p>
                  <h2 className="text-3xl md:text-5xl font-bold text-primary-text font-display uppercase leading-none">
                    {current.title}
                  </h2>
                </div>
                <div className="min-w-[180px] rounded-sm border border-border bg-black/30 px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-secondary-text mb-1">
                    Slots
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary-text">
                      {remainingSlots}
                    </span>
                    <span className="text-sm text-secondary-text">left</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="border border-border bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-secondary-text text-sm mb-3">
                    <Clock size={16} />
                    <span>Kickoff</span>
                  </div>
                  <p className="text-primary-text font-medium">
                    {formatDate(current.date)}
                  </p>
                  <p className="text-secondary-text text-sm mt-1">
                    {formatTime(current.time)}
                  </p>
                </div>

                <div className="border border-border bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-secondary-text text-sm mb-3">
                    <MapPin size={16} />
                    <span>Venue</span>
                  </div>
                  <p className="text-primary-text font-medium leading-relaxed">
                    {current.location}
                  </p>
                </div>

                <div className="border border-border bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-secondary-text text-sm mb-3">
                    <Users size={16} />
                    <span>Registration</span>
                  </div>
                  <p className="text-primary-text font-medium">
                    {registeredCount}/{current.slotsTotal}
                  </p>
                  <p className="text-secondary-text text-sm mt-1">
                    players registered
                  </p>
                </div>
              </div>

              {registeredCount > 0 && (
                <div className="mt-6 flex items-center gap-2 text-secondary-text text-sm">
                  <CheckCircle2 size={16} className="text-accent" />
                  <span>{registeredCount} participant{registeredCount > 1 ? "s" : ""} already registered.</span>
                </div>
              )}
            </div>

            <div className="lg:col-span-5 p-6 md:p-8">
              {current.status === "upcoming" && !submitted ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
                >
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-[0.26em] text-secondary-text mb-2">
                        RSVP
                      </p>
                      <h2 className="text-2xl md:text-3xl font-bold text-primary-text font-display uppercase">
                        Join this match
                      </h2>
                    </div>
                    <div className="inline-flex items-center gap-2 border border-border bg-black/30 px-3 py-2 text-sm text-secondary-text">
                      <Ticket size={14} />
                      {remainingSlots} slot left
                    </div>
                  </div>

                  {remainingSlots <= 0 ? (
                    <div className="border border-border bg-black/20 p-5">
                      <p className="text-primary-text font-medium">Slot penuh.</p>
                      <p className="text-secondary-text text-sm mt-1">
                        Pertandingan ini sudah penuh. Coba pilih match lain di schedule.
                      </p>
                    </div>
                  ) : (
                    <>
                   <div className="mb-6 grid grid-cols-3 gap-2 border-y border-border py-4 text-center">
                     {[['01', 'Choose a game'], ['02', 'RSVP'], ['03', 'Show up']].map(([number, label]) => (
                       <div key={number}>
                         <span className="font-condensed text-[10px] tracking-[0.18em] text-accent">{number}</span>
                         <p className="mt-1 text-[10px] uppercase tracking-[0.12em] text-secondary-text">{label}</p>
                       </div>
                     ))}
                   </div>
                   <p className="text-secondary-text text-sm leading-relaxed mb-6">
                         Tambahkan peserta satu per satu, lalu amankan tempatmu. Pastikan nomor WhatsApp aktif agar detail pertandingan mudah dihubungi.
                      </p>

                      <div className="space-y-4 mb-6">
                        <div>
                          <label htmlFor="rsvp-name" className="block text-[11px] uppercase tracking-[0.22em] text-secondary-text mb-2">
                            Nama
                          </label>
                          <input
                            id="rsvp-name"
                            type="text"
                            placeholder="Masukkan nama peserta"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className="w-full bg-elevated border border-border px-4 py-3 text-primary-text text-sm placeholder:text-secondary-text focus:outline-none focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="rsvp-whatsapp" className="block text-[11px] uppercase tracking-[0.22em] text-secondary-text mb-2">
                            No WhatsApp
                          </label>
                          <input
                            id="rsvp-whatsapp"
                            type="tel"
                            placeholder="Contoh: 08xxxxxxxxxx"
                            value={form.whatsapp}
                            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                            className="w-full bg-elevated border border-border px-4 py-3 text-primary-text text-sm placeholder:text-secondary-text focus:outline-none focus:border-accent transition-colors"
                          />
                        </div>
                        <div>
                          <label htmlFor="rsvp-jersey" className="block text-[11px] uppercase tracking-[0.22em] text-secondary-text mb-2">
                            Jersey Size
                          </label>
                          <select
                            id="rsvp-jersey"
                            value={form.jerseySize}
                            onChange={(e) => setForm({ ...form, jerseySize: e.target.value })}
                            className="w-full bg-elevated border border-border px-4 py-3 text-primary-text text-sm focus:outline-none focus:border-accent transition-colors"
                          >
                            <option value="S">S</option>
                            <option value="M">M</option>
                            <option value="L">L</option>
                            <option value="XL">XL</option>
                          </select>
                        </div>

                        <button
                          onClick={addParticipant}
                          disabled={participants.length >= remainingSlots}
                          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-border text-sm text-secondary-text hover:border-accent hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Plus size={16} /> Tambah peserta
                        </button>
                      </div>

                      {participants.length > 0 && (
                        <div className="mb-6">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs uppercase tracking-[0.24em] text-secondary-text">
                              Participants ({participants.length})
                            </p>
                            <span className="text-xs text-secondary-text">
                              {participants.length} added
                            </span>
                          </div>
                          <div className="space-y-2">
                            {participants.map((p, i) => (
                              <div key={i} className="flex items-center justify-between border border-border bg-black/20 px-4 py-3">
                                <div>
                                  <span className="text-sm text-primary-text">{p.name}</span>
                                  <span className="text-xs text-secondary-text ml-3">{p.jerseySize}</span>
                                </div>
                                <button
                                  onClick={() => removeParticipant(i)}
                                  className="text-secondary-text hover:text-accent transition-colors"
                                  aria-label={`Remove participant ${p.name}`}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {submitError && (
                        <p role="alert" className="mb-4 border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
                          {submitError}
                        </p>
                      )}

                      <button
                        onClick={handleSubmit}
                        disabled={participants.length === 0}
                        className="w-full rounded-full bg-accent py-3.5 text-sm font-medium uppercase tracking-widest text-charcoal transition-all hover:bg-crest-hover hover:shadow-[0_8px_18px_rgba(127,29,50,0.22)] disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Reserving your spot…" : "Submit RSVP"}
                      </button>
                    </>
                  )}
                </motion.div>
              ) : submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                  className="h-full flex items-center"
                >
                  <div className="border border-border bg-black/20 p-6 md:p-8 w-full text-center">
                    <div className="w-16 h-16 rounded-full border border-accent/40 bg-accent/10 flex items-center justify-center mx-auto mb-5">
                      <CheckCircle2 size={28} className="text-accent" />
                    </div>
                     <h2 className="text-2xl font-bold text-primary-text mb-2">You&apos;re on the list.</h2>
                    <p className="text-secondary-text leading-relaxed">
                      {participants.length} participant{participants.length > 1 ? "s" : ""} registered successfully.
                    </p>
                    <p className="text-secondary-text text-sm mt-2">
                      Detail pertandingan akan dikirim ke WhatsApp Anda.
                    </p>
                    <Link
                      href="/schedule"
                      className="inline-flex items-center gap-2 mt-6 px-5 py-3 bg-elevated text-primary-text text-sm uppercase tracking-widest hover:bg-border transition-colors"
                    >
                       Find another game <ArrowRight size={14} />
                    </Link>
                  </div>
                </motion.div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </Section>
  );
}
