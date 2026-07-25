import type { Participant, RsvpEntry } from "@/types";

// Helper to make API requests
async function apiRequest(method: string, body?: any, queryParams?: string) {
  const url = `/api/rsvps${queryParams || ""}`;
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

export async function getRsvpByMatch(matchId: string): Promise<RsvpEntry[]> {
  try {
    return await apiRequest("GET", undefined, `?matchId=${matchId}`);
  } catch (error) {
    console.error(`Failed to get RSVPs for match ${matchId}:`, error);
    return [];
  }
}

export async function getAllRsvp(): Promise<RsvpEntry[]> {
  try {
    return await apiRequest("GET");
  } catch (error) {
    console.error("Failed to get all RSVPs:", error);
    return [];
  }
}

// Alias for getAllRsvp
export async function getRsvps(): Promise<RsvpEntry[]> {
  return getAllRsvp();
}

export async function getParticipantCountByMatch(matchId: string): Promise<number> {
  try {
    const rsvps = await getRsvpByMatch(matchId);
    return rsvps.reduce((sum, r) => sum + r.participants.length, 0);
  } catch (error) {
    console.error(`Failed to get participant count for match ${matchId}:`, error);
    return 0;
  }
}

export async function addRsvp(matchId: string, participants: Participant[]): Promise<RsvpEntry> {
  try {
    return await apiRequest("POST", { matchId, participants });
  } catch (error: any) {
    console.error("Failed to add RSVP:", error);
    throw error;
  }
}