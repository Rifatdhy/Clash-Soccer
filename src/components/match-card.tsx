"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Users } from "lucide-react";
import Badge from "./badge";
import Card from "./card";
import { type Match, formatDate, formatTime } from "@/data/mock";

interface MatchCardProps {
  match: Match;
  index?: number;
}

export default function MatchCard({ match, index = 0 }: MatchCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: [0.32, 0.72, 0, 1] }}
    >
      <Link href={`/schedule/${match.id}`}>
        <Card className="h-full group">
          <div className="flex items-start justify-between mb-6">
            <Badge variant={match.status}>
              {match.status === "upcoming"
                ? "Upcoming"
                : match.status === "ongoing"
                ? "Live"
                : "Completed"}
            </Badge>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-primary-text mb-6 group-hover:text-accent transition-colors font-display">
            {match.title}
          </h3>

          <div className="flex flex-col gap-3">
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
              <span>
                {match.slotsAvailable}/{match.slotsTotal} slots available
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

function CalendarIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}
