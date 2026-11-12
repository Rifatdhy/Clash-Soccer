"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import type { Setting } from "@/types";

export default function AboutView({ settings }: { settings: Setting }) {
  return (
    <>
      <PageHeader title="About" subtitle="Tentang Clash.Soccer — komunitas mini soccer yang lahir dari kecintaan terhadap sepak bola." />

      <Section>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
          >
            <h2 className="text-2xl md:text-4xl font-bold text-primary-text tracking-tight font-display uppercase">
              PLAY TOGETHER. <br />
              <span className="text-secondary-text">WIN TOGETHER.</span>
            </h2>
            <div className="mt-8 space-y-4 text-secondary-text leading-relaxed">
              <p>
                Clash.Soccer adalah komunitas mini soccer yang berbasis di Jakarta. Kami menyatukan
                para pecinta sepak bola dari berbagai latar belakang untuk bermain, berkompetisi,
                dan bertumbuh bersama.
              </p>
              <p>
                Berdiri sejak 2024, kami telah mengadakan puluhan pertandingan rutin dan beberapa
                turnamen yang sukses. Komunitas kami terus berkembang dan selalu membuka pintu
                untuk anggota baru.
              </p>
              <p>
                Lokasi bermain kami di {settings.location}. Dengan lapangan berkualitas dan
                suasana yang kompetitif namun bersahabat, setiap pertandingan terasa seperti
                pertandingan sungguhan.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="aspect-[4/3] bg-black/40 border border-border rounded-sm overflow-hidden relative flex items-center justify-center p-6 md:p-10"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/10 pointer-events-none" />
            <div className="relative z-10 flex items-center justify-center bg-white rounded-2xl p-5 md:p-8 shadow-[0_0_40px_rgba(255,255,255,0.08)]">
              <div className="flex flex-col items-center gap-5 bg-ink px-10 py-12 text-center text-bone md:px-16">
                <Image src="/logo.png" alt="Clash Soccer" width={1024} height={1536} className="h-auto max-h-[330px] w-auto max-w-[230px] object-contain md:max-h-[400px] md:max-w-[290px]" />
              </div>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
