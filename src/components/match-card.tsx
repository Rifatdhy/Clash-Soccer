"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, CalendarIcon, ArrowUpRight } from "lucide-react";
import Badge from "./badge";
import Card from "./card";
import { type Match } from "@/types";
import { formatDate, formatTime } from "@/lib/format";

interface MatchCardProps {
  match: Match;
  index?: number;
}

export default function MatchCard({ match, index = 0 }: MatchCardProps) {
  const available = match.slotsAvailable;
  const filled = Math.max(0, Math.min(match.slotsTotal, match.slotsTotal - available));
  const fillPercent = match.slotsTotal > 0 ? (filled / match.slotsTotal) * 100 : 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
    >
      <Link href={`/schedule/${match.id}`}>
        <Card className="relative h-full overflow-hidden group">
          <div className="mb-8 flex items-start justify-between">
            <Badge variant={match.status}>
              {match.status === "upcoming"
                ? "Upcoming"
                : match.status === "ongoing"
                ? "Live"
                : "Completed"}
            </Badge>
            <span className="font-condensed text-xs uppercase tracking-[0.16em] text-secondary-text">Matchday</span>
          </div>

          <h3 className="mb-7 max-w-[15rem] font-statement text-3xl leading-[0.95] text-primary-text transition-colors group-hover:text-accent md:text-4xl">
            {match.title}
          </h3>

          <div className="flex flex-col gap-3 border-t border-border pt-5">
            <div className="flex items-center gap-3 text-sm text-secondary-text">
              <CalendarIcon size={16} />
              <span>{formatDate(match.date)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary-text">
              <Clock size={16} />
              <span>{formatTime(match.time)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary-text">
              <MapPin size={16} />
              <span>{match.location}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-secondary-text">
              <Users size={16} />
                <span>{available > 0 ? `${available}/${match.slotsTotal} spots available` : "Fully booked"}</span>
            </div>
          </div>
          <div className="mt-7 border-t border-border pt-5">
            <div className="mb-2 flex items-center justify-between font-condensed text-[10px] uppercase tracking-[0.16em] text-secondary-text">
              <span>Capacity</span><span>{filled}/{match.slotsTotal} players</span>
            </div>
            <div className="h-1.5 overflow-hidden bg-elevated" aria-label={`${filled} of ${match.slotsTotal} players registered`} role="progressbar" aria-valuemin={0} aria-valuemax={match.slotsTotal} aria-valuenow={filled}>
              <div className="h-full bg-accent transition-all" style={{ width: `${fillPercent}%` }} />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between font-condensed text-xs uppercase tracking-[0.16em] text-secondary-text">
            <span>{available > 0 ? "Join this game" : "View fixture"}</span><ArrowUpRight size={16} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

