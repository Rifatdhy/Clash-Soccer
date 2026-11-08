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
        subtitle="Pertanyaan yang sering diajukan tentang Clash.Soccer."
      />

      <Section>
        <div className="max-w-3xl mx-auto">
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
