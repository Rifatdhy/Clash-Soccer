"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import { getSettings } from "@/lib/settings-store";
import { type Setting } from "@/data/mock";

export default function AboutPage() {
  const [settings, setSettings] = useState<Setting | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return null;
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
            className="aspect-[4/3] bg-elevated border border-border"
          >
            <div className="w-full h-full bg-gradient-to-br from-elevated to-border flex items-center justify-center">
              <span className="text-secondary-text text-sm uppercase tracking-widest">Community Photo</span>
            </div>
          </motion.div>
        </div>
      </Section>

      <Section className="bg-surface border-y border-border">
        <div className="text-center max-w-2xl mx-auto">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
            className="text-2xl md:text-4xl font-bold text-primary-text tracking-tight"
          >
            Our Location
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="mt-4 text-secondary-text"
          >
            {settings.location}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
            className="mt-8 aspect-[16/9] bg-elevated border border-border"
          >
            <div className="w-full h-full bg-gradient-to-br from-elevated to-border flex items-center justify-center">
              <span className="text-secondary-text text-sm uppercase tracking-widest">Google Maps</span>
            </div>
          </motion.div>
        </div>
      </Section>
    </>
  );
}
