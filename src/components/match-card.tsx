"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Clock, Users, CalendarIcon } from "lucide-react";
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
                {available}/{match.slotsTotal} slots available
              </span>
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

