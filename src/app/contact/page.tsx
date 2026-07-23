"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageCircle, MapPin } from "lucide-react";

function InstagramIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
    </svg>
  );
}
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import Card from "@/components/card";
import { getSettings } from "@/lib/settings-store";
import { type Setting } from "@/data/mock";

export default function ContactPage() {
  const [settings, setSettings] = useState<Setting | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return null;

  const contactItems = [
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: settings.whatsapp,
      href: `https://wa.me/${settings.whatsapp}`,
    },
    {
      icon: InstagramIcon,
      label: "Instagram",
      value: `@${settings.instagram}`,
      href: `https://instagram.com/${settings.instagram}`,
    },
    {
      icon: MapPin,
      label: "Location",
      value: settings.location,
      href: null,
    },
  ];
  return (
    <>
      <PageHeader
        title="Contact"
        subtitle="Hubungi Clash.Soccer melalui WhatsApp atau Instagram."
      />

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {contactItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
            >
              {item.href ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  <Card className="h-full text-center group">
                    <item.icon size={24} className="mx-auto text-secondary-text group-hover:text-accent transition-colors" />
                    <h3 className="text-sm uppercase tracking-widest text-primary-text mt-4 mb-2">{item.label}</h3>
                    <p className="text-sm text-secondary-text">{item.value}</p>
                  </Card>
                </a>
              ) : (
                <Card className="h-full text-center">
                  <item.icon size={24} className="mx-auto text-secondary-text" />
                  <h3 className="text-sm uppercase tracking-widest text-primary-text mt-4 mb-2">{item.label}</h3>
                  <p className="text-sm text-secondary-text">{item.value}</p>
                </Card>
              )}
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.32, 0.72, 0, 1] }}
          className="mt-16 aspect-[16/9] bg-elevated border border-border max-w-4xl mx-auto"
        >
          <div className="w-full h-full bg-gradient-to-br from-elevated to-border flex items-center justify-center">
            <span className="text-secondary-text text-sm uppercase tracking-widest">Google Maps</span>
          </div>
        </motion.div>
      </Section>
    </>
  );
}
