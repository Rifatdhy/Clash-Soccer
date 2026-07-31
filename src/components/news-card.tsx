"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Card from "./card";
import { type NewsItem } from "@/types";
import { formatDate } from "@/lib/format";
import Image from "next/image";

interface NewsCardProps {
  item: NewsItem;
  index?: number;
}

export default function NewsCard({ item, index = 0 }: NewsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
    >
      <Link href={`/news/${item.slug}`}>
        <Card className="h-full group">
          <div className="aspect-[16/9] bg-elevated mb-6 overflow-hidden relative">
            {item.coverImage ? (
              <Image
                src={item.coverImage}
                alt={item.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain object-center p-3 group-hover:scale-[1.02] transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-elevated to-border" />
            )}
          </div>
          <p className="text-xs text-secondary-text uppercase tracking-widest mb-2">
            {formatDate(item.date)}
          </p>
          <h3 className="text-lg md:text-xl font-bold text-primary-text mb-3 group-hover:text-accent transition-colors font-display">
            {item.title}
          </h3>
          <p className="text-sm text-secondary-text leading-relaxed line-clamp-2">
            {item.excerpt}
          </p>
        </Card>
      </Link>
    </motion.div>
  );
}
