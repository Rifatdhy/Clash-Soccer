import { type Match } from "@/types";

// Helper to make API requests
async function apiRequest(method: string, body?: unknown, queryParams?: string) {
  const url = `/api/matches${queryParams || ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }
  const result = await response.json();
  if (!result.success) {
    throw new Error(`API returned error: ${result.error.message}`);
  }
  return result.data;
}

export async function getMatches(): Promise<Match[]> {
  return await apiRequest("GET");
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  try {
    const match = await apiRequest("GET", undefined, `?id=${id}`);
    if (!match) return undefined;

    return Array.isArray(match) ? match[0] : match;
  } catch (error) {
    console.error(`Failed to get match by id ${id}:`, error);
    return undefined;
  }
}

export async function getUpcomingMatches(): Promise<Match[]> {
  try {
    const matches = await getMatches();
    return matches.filter((m) => m.status === "upcoming");
  } catch (error) {
    console.error("Failed to get upcoming matches:", error);
    return [];
  }
}

export async function getCompletedMatches(): Promise<Match[]> {
  try {
    const matches = await getMatches();
    return matches.filter((m) => m.status === "completed");
  } catch (error) {
    console.error("Failed to get completed matches:", error);
    return [];
  }
}

export async function createMatch(match: Match): Promise<Match[]> {
  try {
    return await apiRequest("POST", match);
  } catch (error) {
    console.error("Failed to create match:", error);
    return getMatches();
  }
}

export async function updateMatch(id: string, updates: Partial<Match>): Promise<Match[]> {
  try {
    return await apiRequest("PUT", { id, ...updates });
  } catch (error) {
    console.error(`Failed to update match ${id}:`, error);
    return getMatches();
  }
}

export async function deleteMatch(id: string): Promise<Match[]> {
  try {
    return await apiRequest("DELETE", undefined, `?id=${id}`);
  } catch (error) {
    console.error(`Failed to delete match ${id}:`, error);
    return getMatches();
  }
}