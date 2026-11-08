"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Play, ExternalLink } from "lucide-react";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import { formatDate } from "@/lib/format";
import type { Album } from "@/types";
import { BrandFallback } from "@/components/content-state";

export default function AlbumDetailView({ album }: { album: Album }) {
  const [lightbox, setLightbox] = useState<string | null>(null);

  return (
    <>
      <PageHeader
        title={album.title}
        subtitle={formatDate(album.matchDate)}
      />

      <Section>
        <Link
          href="/gallery"
          className="inline-flex items-center gap-2 text-sm uppercase tracking-widest text-secondary-text hover:text-accent transition-colors mb-12"
        >
          <ArrowLeft size={14} /> Back to Gallery
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {album.items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.32, 0.72, 0, 1] }}
              className="aspect-[4/3] bg-elevated border border-border overflow-hidden cursor-pointer group relative"
              onClick={() => item.type === "image" && item.url && setLightbox(item.url)}
            >
              {item.url && item.type === "image" ? (
                <Image src={item.url} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover group-hover:opacity-80 transition-opacity" />
              ) : (
                <BrandFallback label="CLASH / FRAME" />
              )}
              {item.type === "video" && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-14 h-14 border-2 border-accent rounded-full flex items-center justify-center">
                    <Play size={20} className="text-accent ml-1" />
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {album.gdriveLink && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="mt-12 p-6 border border-accent/30 bg-accent/5"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h3 className="text-base font-semibold text-primary-text mb-1">
                  Foto Lengkap Tersedia
                </h3>
                <p className="text-sm text-secondary-text">
                  Lihat dan download semua foto dalam kualitas penuh
                </p>
              </div>
              <a
                href={album.gdriveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-charcoal text-sm font-medium uppercase tracking-widest hover:opacity-90 transition-opacity whitespace-nowrap"
              >
                <ExternalLink size={16} />
                Buka Google Drive
              </a>
            </div>
          </motion.div>
        )}
      </Section>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-charcoal/95 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}
          >
            <button
              onClick={() => setLightbox(null)}
              aria-label="Tutup pratinjau gambar"
              className="absolute top-6 right-6 text-primary-text hover:text-accent transition-colors"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative w-full max-w-4xl max-h-[85vh]"
            >
              <Image src={lightbox} alt="" fill sizes="100vw" className="object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
