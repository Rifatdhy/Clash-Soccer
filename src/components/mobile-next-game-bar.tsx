"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import type { Match } from "@/types";

export default function MobileNextGameBar({ match }: { match: Match }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const hero = document.querySelector("[data-home-hero]");
    const schedule = document.querySelector("[data-home-schedule]");
    if (!hero) return;
    const visibility = new Map<Element, boolean>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visibility.set(entry.target, entry.isIntersecting);
        setVisible(visibility.get(hero) === false && (!schedule || visibility.get(schedule) !== true));
      },
      { threshold: 0.05 }
    );
    observer.observe(hero);
    if (schedule) observer.observe(schedule);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-line bg-ink/95 px-4 py-3 backdrop-blur-md md:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
      <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-condensed text-[10px] uppercase tracking-[0.18em] text-bone-dim">Pertandingan berikutnya</p>
          <p className="truncate text-sm text-bone">{match.title}</p>
        </div>
        <Link href={`/schedule/${match.id}`} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full bg-accent px-4 py-3 font-condensed text-xs uppercase tracking-[0.14em] text-charcoal">
          {match.slotsAvailable > 0 ? "Join" : "View"} <ArrowRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
