import type { Participant, RsvpEntry } from "@/types";
import { api } from "./api-client";

export function getAllRsvp(): Promise<RsvpEntry[]> {
  return api.get<RsvpEntry[]>("/api/rsvps");
}

export function addRsvp(matchId: string, participants: Participant[]): Promise<RsvpEntry> {
  return api.post<RsvpEntry>("/api/rsvps", { matchId, participants });
}

export function deleteRsvp(id: string): Promise<void> {
  return api.delete<void>(`/api/rsvps?id=${encodeURIComponent(id)}`);
}
