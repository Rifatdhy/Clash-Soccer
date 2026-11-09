import type { Metadata } from "next";
import ScheduleView from "@/components/views/schedule-view";
import { fetchMatches } from "@/lib/data";
import { sortByKickoff, splitMatchesByTiming } from "@/lib/match-groups";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Schedule — Clash.Soccer",
  description: "Jadwal pertandingan mini soccer Clash.Soccer.",
};

export default async function SchedulePage() {
  const matches = await fetchMatches();
  const { current, past } = splitMatchesByTiming(matches);

  return (
    <ScheduleView
      upcomingMatches={sortByKickoff(current)}
      pastMatches={past}
    />
  );
}
