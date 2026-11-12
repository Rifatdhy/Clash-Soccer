"use client";

import { motion } from "framer-motion";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import Card from "@/components/card";
import { InstagramIcon, WhatsAppIcon } from "@/components/icons";
import type { Setting } from "@/types";

export default function ContactView({ settings }: { settings: Setting }) {
  const contactItems = [
    {
      icon: WhatsAppIcon,
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
  ];

  return (
    <>
      <PageHeader
        title="Contact"
        subtitle="Hubungi Clash.Soccer melalui WhatsApp atau Instagram."
      />

      <Section>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {contactItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: [0.32, 0.72, 0, 1] }}
            >
              {item.href && (
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  <Card className="h-full text-center group">
                    <item.icon size={24} className="mx-auto text-secondary-text group-hover:text-accent transition-colors" />
                    <h3 className="text-sm uppercase tracking-widest text-primary-text mt-4 mb-2">
                      {item.label === "WhatsApp" ? "Tanya admin" : item.label}
                    </h3>
                    <p className="text-sm text-secondary-text">{item.value}</p>
                  </Card>
                </a>
              )}
            </motion.div>
          ))}
        </div>
      </Section>
    </>
  );
}
