import type { Participant, RsvpEntry } from "@/types";

// Helper to make API requests
async function apiRequest<T>(
  method: string,
  body?: unknown,
  queryParams?: string
): Promise<T> {
  const url = `/api/rsvps${queryParams || ""}`;
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const result = await response.json();

  if (!response.ok || !result.success) {
    const errorMessage = result?.error?.message || response.statusText || "An unknown API error occurred";
    throw new Error(errorMessage);
  }

  return result.data as T;
}

export function getAllRsvp(): Promise<RsvpEntry[]> {
  return apiRequest("GET");
}

export async function addRsvp(matchId: string, participants: Participant[]): Promise<RsvpEntry> {
  try {
    return await apiRequest("POST", { matchId, participants });
  } catch (error) {
    console.error("Failed to add RSVP:", error);
    throw error;
  }
}

export async function deleteRsvp(id: string): Promise<void> {
  try {
    await apiRequest("DELETE", undefined, `?id=${encodeURIComponent(id)}`);
  } catch (error) {
    console.error(`Failed to delete RSVP ${id}:`, error);
    throw error;
  }
}
