"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import type { FaqItem } from "@/types";

export default function FaqView({ faqs }: { faqs: FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = faqs.filter(
    (faq) =>
      faq.question.trim() !== "" &&
      (faq.question.toLowerCase().includes(search.toLowerCase()) ||
        faq.answer.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHeader
        title="FAQ"
          subtitle="Cara ikut main, lokasi, pembayaran, dan hal-hal yang perlu kamu tahu sebelum kick-off."
      />

      <Section>
          <div className="mx-auto max-w-3xl">
            <div className="mb-10 grid gap-3 sm:grid-cols-3">
              {[['01', 'Cara ikut main'], ['02', 'Hari pertandingan'], ['03', 'Sebelum kick-off']].map(([number, label]) => (
                <div key={number} className="border-t-2 border-accent pt-3">
                  <span className="font-condensed text-xs tracking-[0.18em] text-accent">{number}</span>
                  <p className="mt-2 font-display text-sm text-primary-text">{label}</p>
                </div>
              ))}
            </div>
          <div className="relative mb-12">
            <Search
              size={16}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary-text"
            />
            <input
              type="text"
              aria-label="Cari pertanyaan yang sering diajukan"
              placeholder="Search FAQs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-elevated border border-border pl-12 pr-4 py-3 text-primary-text text-sm placeholder:text-secondary-text focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          {filtered.map((faq, i) => (
            <motion.div
              key={faq.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] }}
              className="border-b border-border"
            >
              <button
                onClick={() => setOpenId(openId === faq.id ? null : faq.id)}
                aria-expanded={openId === faq.id}
                aria-controls={`faq-answer-${faq.id}`}
                className="w-full flex items-center justify-between py-6 text-left"
              >
                <span className="text-base md:text-lg font-medium text-primary-text pr-4">
                  {faq.question}
                </span>
                <ChevronDown
                  size={18}
                  className={`text-secondary-text transition-transform duration-300 flex-shrink-0 ${
                    openId === faq.id ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openId === faq.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                    id={`faq-answer-${faq.id}`}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-secondary-text leading-relaxed pb-6 -mt-2">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <p className="text-center text-secondary-text py-12">Pertanyaan tidak ditemukan.</p>
          )}
        </div>
      </Section>
    </>
  );
}
