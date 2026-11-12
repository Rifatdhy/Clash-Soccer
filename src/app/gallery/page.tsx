import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import GalleryCard from "@/components/gallery-card";
import { fetchAlbums } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Gallery — Clash.Soccer",
  description: "Dokumentasi setiap momen pertandingan Clash.Soccer.",
};

export default async function GalleryPage() {
  const albums = await fetchAlbums();

  return (
    <>
      <PageHeader
        title="The Clash archive"
        subtitle="Dokumentasi momen-momen pertandingan Clash.Soccer."
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
