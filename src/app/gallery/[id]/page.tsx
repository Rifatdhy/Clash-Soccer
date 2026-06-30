"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, X, Play } from "lucide-react";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import { albums, formatDate } from "@/data/mock";

export default function AlbumDetailPage() {
  const params = useParams();
  const album = albums.find((a) => a.id === params.id);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!album) {
    return (
      <Section>
        <p className="text-secondary-text">Album not found.</p>
        <Link href="/gallery" className="text-accent mt-4 inline-block">Back to Gallery</Link>
      </Section>
    );
  }

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
              onClick={() => item.type === "image" && setLightbox(item.id)}
            >
              <div className="w-full h-full bg-gradient-to-br from-elevated to-border group-hover:opacity-80 transition-opacity" />
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
              className="absolute top-6 right-6 text-primary-text hover:text-accent transition-colors"
            >
              <X size={24} />
            </button>
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-4xl aspect-[4/3] bg-elevated border border-border"
            >
              <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
