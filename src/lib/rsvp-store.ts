export interface Participant {
  name: string;
  whatsapp: string;
  jerseySize: string;
}

export interface RsvpEntry {
  id: string;
  matchId: string;
  participants: Participant[];
  registeredAt: string;
}

const STORAGE_KEY = "clash-soccer-rsvp";

function load(): RsvpEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(data: RsvpEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getRsvpByMatch(matchId: string): RsvpEntry[] {
  return load().filter((r) => r.matchId === matchId);
}

export function getAllRsvp(): RsvpEntry[] {
  return load();
}

export function getParticipantCountByMatch(matchId: string): number {
  return load()
    .filter((r) => r.matchId === matchId)
    .reduce((sum, r) => sum + r.participants.length, 0);
}

export function addRsvp(matchId: string, participants: Participant[]): RsvpEntry {
  const data = load();
  const entry: RsvpEntry = {
    id: `rsvp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    matchId,
    participants,
    registeredAt: new Date().toISOString(),
  };
  data.push(entry);
  save(data);
  return entry;
}
