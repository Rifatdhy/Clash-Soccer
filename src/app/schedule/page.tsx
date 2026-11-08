import type { Metadata } from "next";
import ScheduleView from "@/components/views/schedule-view";
import { fetchMatches } from "@/lib/data";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule — Clash.Soccer",
  description: "Jadwal pertandingan mini soccer Clash.Soccer.",
};

export default async function SchedulePage() {
  const matches = await fetchMatches();
  const upcomingMatches = matches.filter((match) => match.status === "upcoming");
  const pastMatches = matches.filter((match) => match.status === "completed");

  return (
    <ScheduleView
      upcomingMatches={upcomingMatches}
      pastMatches={pastMatches}
    />
  );
}
