import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ScheduleDetailView from "@/components/views/schedule-detail-view";
import { fetchMatch } from "@/lib/data";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const match = await fetchMatch(id);
  if (!match) return { title: "Match not found — Clash.Soccer" };

  return {
    title: `${match.title} — Clash.Soccer`,
    description: `${match.title} pada ${formatDate(match.date)} di ${match.location}.`,
  };
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  const match = await fetchMatch(id);
  if (!match) notFound();

  return <ScheduleDetailView match={match} />;
}
