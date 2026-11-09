import Link from "next/link";
import { type Match } from "@/types";
import { formatDate, formatTime } from "@/lib/format";
import { SlotMeter } from "./slot-meter";

interface FixtureRowProps {
  match: Match;
}

/**
 * One fixture in the schedule list. The entire row is the link: the whole
 * surface is the affordance, so there is no small target to miss. The date,
 * title and remaining places are plain text, which keeps the link's accessible
 * name readable rather than a chain of unlabelled fragments.
 */
export function FixtureRow({ match }: FixtureRowProps) {
  return (
    <Link
      href={`/schedule/${match.id}`}
      className="group grid grid-cols-1 gap-2 border-b border-ink-line py-5 transition-transform duration-200 hover:-translate-y-0.5 md:grid-cols-[9rem_1fr_auto] md:items-center md:gap-6"
    >
      <div className="font-condensed uppercase text-bone-dim">
        <p>{formatDate(match.date)}</p>
        <p>{formatTime(match.time)}</p>
        {match.status === "ongoing" && (
          <span className="font-condensed text-xs uppercase tracking-[0.18em] text-crest-ink">
            <span className="live-pulse mr-1 inline-block h-1.5 w-1.5 rounded-full bg-crest-ink" />
            LIVE
          </span>
        )}
      </div>

      <div>
        <h3 className="font-condensed text-xl text-bone">{match.title}</h3>
        <p className="text-sm text-bone-dim">{match.location}</p>
      </div>

      <SlotMeter available={match.slotsAvailable} total={match.slotsTotal} />
    </Link>
  );
}
