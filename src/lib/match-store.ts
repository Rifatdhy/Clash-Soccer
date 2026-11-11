import { type Match } from "@/types";
import { api } from "./api-client";

export function getMatches(): Promise<Match[]> {
  return api.get<Match[]>("/api/matches");
}

export function createMatch(match: Match): Promise<Match[]> {
  return api.post<Match[]>("/api/matches", match);
}

export function updateMatch(
  id: string,
  updates: Partial<Match>
): Promise<Match[]> {
  return api.put<Match[]>("/api/matches", { id, ...updates });
}

export function deleteMatch(id: string): Promise<Match[]> {
  return api.delete<Match[]>(`/api/matches?id=${encodeURIComponent(id)}`);
}
