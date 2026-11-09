import { randomUUID } from "crypto";
import { query, withTransaction } from "./db.ts";
import { invalidateDataCache } from "./data.ts";
import { createLogger } from "./logger.ts";
import { canReserve, restoreSlots } from "./slots.ts";
import { duplicateWhatsAppNumbers } from "./rsvp-utils.ts";
import type { Participant, RsvpEntry } from "@/types";

const logger = createLogger({ service: "rsvp" });

export type CreateRsvpResult =
  | { kind: "ok"; id: string; registeredAt: string }
  | { kind: "not_found" }
  | { kind: "no_slots" }
  | { kind: "duplicate"; duplicates: string[] };

export type DeleteRsvpResult = { kind: "ok" } | { kind: "not_found" };

interface RsvpQueryRow {
  id: string;
  match_id: string;
  participants: unknown;
  registered_at: string;
  created_at: string;
  match_title: string;
  match_date: string;
  match_time: string;
}

interface ParticipantRow {
  name?: string;
  whatsapp?: string;
  phone?: string;
  jerseySize?: string;
  jersey_size?: string;
}

function parseParticipants(raw: unknown): ParticipantRow[] {
  let parsed: unknown = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      logger.error("Failed to parse stored participants JSON", { error });
      return [];
    }
  }
  return Array.isArray(parsed) ? (parsed as ParticipantRow[]) : [];
}

function mapRsvp(row: RsvpQueryRow): RsvpEntry {
  const participants = parseParticipants(row.participants).map(
    (participant): Participant => ({
      name: participant.name || "",
      whatsapp: participant.whatsapp || participant.phone || "",
      jerseySize: participant.jerseySize || participant.jersey_size || "M",
    })
  );

  return {
    id: row.id,
    matchId: row.match_id,
    matchTitle: row.match_title,
    matchDate: row.match_date,
    matchTime: row.match_time,
    participants,
    totalParticipants: participants.length,
    createdAt: row.created_at || row.registered_at,
  };
}

export async function listRsvps(matchId?: string): Promise<RsvpEntry[]> {
  const result = matchId
    ? await query<RsvpQueryRow>(
        `SELECT r.*, m.title as match_title, m.date as match_date, m.time as match_time, r.created_at as registered_at
         FROM rsvps r
         LEFT JOIN matches m ON m.id = r.match_id
         WHERE r.match_id = $1 ORDER BY r.created_at DESC`,
        [matchId]
      )
    : await query<RsvpQueryRow>(
        `SELECT r.*, m.title as match_title, m.date as match_date, m.time as match_time, r.created_at as registered_at
         FROM rsvps r
         LEFT JOIN matches m ON m.id = r.match_id
         ORDER BY r.created_at DESC`
      );

  return result.rows.map(mapRsvp);
}

export async function createRsvp(input: {
  matchId: string;
  participants: Participant[];
}): Promise<CreateRsvpResult> {
  const { matchId, participants } = input;

  const result = await withTransaction(async (client) => {
    const matchRes = await client.query<{ slots_available: number }>(
      "SELECT slots_available FROM matches WHERE id = $1 FOR UPDATE",
      [matchId]
    );
    if (matchRes.rowCount === 0) {
      return { kind: "not_found" as const };
    }

    const { slots_available } = matchRes.rows[0];
    if (!canReserve(slots_available, participants.length)) {
      return { kind: "no_slots" as const };
    }

    const existingRes = await client.query<{ participants: unknown }>(
      "SELECT participants FROM rsvps WHERE match_id = $1",
      [matchId]
    );
    const existing = existingRes.rows.flatMap((row) => parseParticipants(row.participants));
    const duplicates = duplicateWhatsAppNumbers(existing, participants);
    if (duplicates.length > 0) {
      return { kind: "duplicate" as const, duplicates };
    }

    const id = `rsvp-${randomUUID()}`;
    const registeredAt = new Date().toISOString();

    await client.query(
      "INSERT INTO rsvps (id, match_id, participants, registered_at) VALUES ($1, $2, $3, $4)",
      [id, matchId, JSON.stringify(participants), registeredAt]
    );

    await client.query(
      "UPDATE matches SET slots_available = $1 WHERE id = $2",
      [slots_available - participants.length, matchId]
    );

    return { kind: "ok" as const, id, registeredAt };
  });

  if (result.kind === "ok") {
    invalidateDataCache();
  }

  return result;
}

export async function deleteRsvp(id: string): Promise<DeleteRsvpResult> {
  const result = await withTransaction(async (client) => {
    const rsvpRes = await client.query<{ match_id: string; participants: unknown }>(
      "SELECT match_id, participants FROM rsvps WHERE id = $1 FOR UPDATE",
      [id]
    );
    if (rsvpRes.rowCount === 0) {
      return { kind: "not_found" as const };
    }

    const { match_id, participants } = rsvpRes.rows[0];
    const participantCount = parseParticipants(participants).length;

    await client.query("DELETE FROM rsvps WHERE id = $1", [id]);

    const matchRes = await client.query<{ slots_total: number; slots_available: number }>(
      "SELECT slots_total, slots_available FROM matches WHERE id = $1 FOR UPDATE",
      [match_id]
    );
    if (matchRes.rows[0]) {
      const { slots_total, slots_available } = matchRes.rows[0];
      await client.query("UPDATE matches SET slots_available = $1 WHERE id = $2", [
        restoreSlots(slots_total, slots_available, participantCount),
        match_id,
      ]);
    }

    return { kind: "ok" as const };
  });

  if (result.kind === "ok") {
    invalidateDataCache();
  }

  return result;
}
