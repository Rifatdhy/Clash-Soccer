import { type Match } from "@/data/mock";

// Helper to make API requests
async function apiRequest(method: string, body?: any, queryParams?: string) {
  const url = `/api/matches${queryParams || ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }
  return response.json();
}

export async function getMatches(): Promise<Match[]> {
  try {
    return await apiRequest("GET");
  } catch (error) {
    console.error("Failed to get matches, using fallback:", error);
    // Return mock matches as fallback
    return [
      { id: "m1", title: "Clash Weekly #47", date: "2026-07-27", time: "19:00", location: "Lapangan ABC Sports", slotsTotal: 20, slotsAvailable: 20, status: "upcoming" },
      { id: "m2", title: "Clash Weekly #48", date: "2026-08-03", time: "19:00", location: "Lapangan ABC Sports", slotsTotal: 20, slotsAvailable: 15, status: "upcoming" },
      { id: "m3", title: "Clash Weekly #46", date: "2026-07-20", time: "19:00", location: "Lapangan ABC Sports", slotsTotal: 20, slotsAvailable: 0, status: "completed" },
    ];
  }
}

export async function getMatchById(id: string): Promise<Match | undefined> {
  try {
    const response = await fetch(`/api/matches?id=${id}`);
    if (!response.ok) return undefined;
    const match = await response.json();
    return match;
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