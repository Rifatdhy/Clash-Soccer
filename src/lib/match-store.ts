import { type Match } from "@/data/mock";

const STORAGE_KEY = "clash-soccer-matches";

const initialMatches: Match[] = [
  {
    id: "m1", title: "Clash Weekly #47", date: "2026-07-04", time: "19:00",
    location: "Lapangan ABC Sports", slotsTotal: 20, slotsAvailable: 20, status: "upcoming",
  },
  {
    id: "m2", title: "Clash Weekly #48", date: "2026-07-11", time: "19:00",
    location: "Lapangan ABC Sports", slotsTotal: 20, slotsAvailable: 20, status: "upcoming",
  },
  {
    id: "m3", title: "Clash Weekly #49", date: "2026-07-18", time: "20:00",
    location: "Lapangan DEF Field", slotsTotal: 18, slotsAvailable: 18, status: "upcoming",
  },
  {
    id: "m4", title: "Clash Cup 2026", date: "2026-07-25", time: "14:00",
    location: "Stadion GHI", slotsTotal: 30, slotsAvailable: 30, status: "upcoming",
  },
  {
    id: "m5", title: "Clash Weekly #50", date: "2026-08-01", time: "19:00",
    location: "Lapangan ABC Sports", slotsTotal: 20, slotsAvailable: 20, status: "upcoming",
  },
  {
    id: "m6", title: "Clash Weekly #45", date: "2026-06-20", time: "19:00",
    location: "Lapangan ABC Sports", slotsTotal: 20, slotsAvailable: 0, status: "completed",
  },
  {
    id: "m7", title: "Clash Weekly #44", date: "2026-06-13", time: "19:00",
    location: "Lapangan ABC Sports", slotsTotal: 20, slotsAvailable: 0, status: "completed",
  },
  {
    id: "m8", title: "Clash Weekly #43", date: "2026-06-06", time: "20:00",
    location: "Lapangan DEF Field", slotsTotal: 18, slotsAvailable: 0, status: "completed",
  },
];

function load(): Match[] {
  if (typeof window === "undefined") return initialMatches;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialMatches));
      return initialMatches;
    }
    return JSON.parse(raw);
  } catch {
    return initialMatches;
  }
}

function save(data: Match[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getMatches(): Match[] {
  return load();
}

export function getMatchById(id: string): Match | undefined {
  return load().find((m) => m.id === id);
}

export function getUpcomingMatches(): Match[] {
  return load().filter((m) => m.status === "upcoming");
}

export function getCompletedMatches(): Match[] {
  return load().filter((m) => m.status === "completed");
}

export function createMatch(match: Match): Match[] {
  const data = load();
  data.unshift(match);
  save(data);
  return data;
}

export function updateMatch(id: string, updates: Partial<Match>): Match[] {
  const data = load().map((m) => (m.id === id ? { ...m, ...updates } : m));
  save(data);
  return data;
}

export function deleteMatch(id: string): Match[] {
  const data = load().filter((m) => m.id !== id);
  save(data);
  return data;
}
