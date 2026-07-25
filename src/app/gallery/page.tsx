"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import GalleryCard from "@/components/gallery-card";
import { getAlbums } from "@/lib/album-store";
import { type Album } from "@/data/mock";

export default function GalleryPage() {
  const [albums, setAlbums] = useState<Album[] | null>(null);

  useEffect(() => {
    getAlbums().then(setAlbums);
  }, []);

  if (!albums) return null;

  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Dokumentasi setiap momen pertandingan Clash.Soccer."
      />

      <Section>
        {albums.length === 0 ? (
          <p className="text-secondary-text text-center">Belum ada album.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {albums.map((album, i) => (
              <GalleryCard key={album.id} album={album} index={i} />
            ))}
          </div>
        )}
      </Section>
    </>
  );
}
