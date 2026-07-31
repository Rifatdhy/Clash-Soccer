"use client";

import { useState, useEffect } from "react";
import PageHeader from "@/components/page-header";
import Section from "@/components/section";
import MatchCard from "@/components/match-card";
import { getUpcomingMatches, getCompletedMatches } from "@/lib/match-store";
import type { Match } from "@/types";

export default function SchedulePage() {
  const [showPast, setShowPast] = useState(false);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[] | null>(null);
  const [pastMatches, setPastMatches] = useState<Match[]>([]);

  useEffect(() => {
    async function fetchMatches() {
      const upcoming = await getUpcomingMatches();
      const past = await getCompletedMatches();
      setUpcomingMatches(upcoming);
      setPastMatches(past);
    }
    fetchMatches();
  }, []);

  if (!upcomingMatches) return null;

  return (
    <>
      <PageHeader
        title="Schedule"
        subtitle="Jadwal pertandingan Clash.Soccer. Jangan lewatkan kesempatan untuk bermain."
      />

      <Section>
        <h2 className="text-2xl font-bold text-primary-text mb-8 tracking-tight font-display uppercase">
          Upcoming Matches
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingMatches.map((match, i) => (
            <MatchCard key={match.id} match={match} index={i} />
          ))}
        </div>

        {pastMatches.length > 0 && (
          <div className="mt-20">
            <button
              onClick={() => setShowPast(!showPast)}
              className="flex items-center gap-2 text-sm uppercase tracking-widest text-secondary-text hover:text-accent transition-colors"
            >
              {showPast ? "Hide" : "Show"} Past Matches ({pastMatches.length})
            </button>

            {showPast && (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastMatches.map((match, i) => (
                  <MatchCard key={match.id} match={match} index={i} />
                ))}
              </div>
            )}
          </div>
        )}
      </Section>
    </>
  );
}
