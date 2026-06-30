"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import Card from "./card";
import { type Album, formatDate } from "@/data/mock";

interface GalleryCardProps {
  album: Album;
  index?: number;
}

export default function GalleryCard({ album, index = 0 }: GalleryCardProps) {
  const videoCount = album.items.filter((i) => i.type === "video").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
    >
      <Link href={`/gallery/${album.id}`}>
        <Card className="h-full group">
          <div className="aspect-[4/3] bg-elevated mb-6 overflow-hidden relative">
            <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
            {videoCount > 0 && (
              <div className="absolute bottom-3 right-3 bg-charcoal/80 px-2 py-1 flex items-center gap-1">
                <Play size={12} className="text-accent" />
                <span className="text-xs text-primary-text">{videoCount}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-secondary-text uppercase tracking-widest mb-2">
            {formatDate(album.matchDate)}
          </p>
          <h3 className="text-lg md:text-xl font-bold text-primary-text group-hover:text-accent transition-colors font-display">
            {album.title}
          </h3>
          <p className="text-sm text-secondary-text mt-1">
            {album.items.length} items
          </p>
        </Card>
      </Link>
    </motion.div>
  );
}
