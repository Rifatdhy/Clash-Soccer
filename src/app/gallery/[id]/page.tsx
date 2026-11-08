import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AlbumDetailView from "@/components/views/gallery-detail-view";
import { fetchAlbum } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const album = await fetchAlbum(id);
  if (!album) return { title: "Album not found — Clash.Soccer" };

  return {
    title: `${album.title} — Clash.Soccer`,
    description: `Dokumentasi ${album.title} pada ${formatDate(album.matchDate)}.`,
  };
}

export default async function AlbumDetailPage({ params }: PageProps) {
  const { id } = await params;
  const album = await fetchAlbum(id);
  if (!album) notFound();

  return <AlbumDetailView album={album} />;
}
