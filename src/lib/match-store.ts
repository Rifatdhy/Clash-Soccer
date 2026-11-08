import { type Match } from "@/types";
import { api, ApiError } from "./api-client";

export function getMatches(): Promise<Match[]> {
  return api.get<Match[]>("/api/matches");
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  try {
    return await api.get<Match>(`/api/matches?id=${encodeURIComponent(id)}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return undefined;
    throw error;
  }
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
