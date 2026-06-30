"use client";

import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import GalleryCard from "@/components/gallery-card";
import { albums } from "@/data/mock";

export default function GalleryPage() {
  return (
    <>
      <PageHeader
        title="Gallery"
        subtitle="Dokumentasi setiap momen pertandingan Clash.Soccer."
      />

      <Section>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {albums.map((album, i) => (
            <GalleryCard key={album.id} album={album} index={i} />
          ))}
        </div>
      </Section>
    </>
  );
}
