import "server-only";
import { Email, CalendarEvent } from "@/lib/types";
import {
  getPool,
  ready,
  rowToEmail,
  rowToEvent,
  insertEmail,
  insertEvent,
} from "./db";

/**
 * Postgres-backed store. Every read/write is scoped to a userId (the Corsair
 * tenant). The SSE listener set stays in-process (kept on globalThis across
 * HMR); broadcasts are tagged with a userId so a write only fans out to that
 * user's connected browsers — never another user's.
 */

type Listener = {
  userId: string;
  send: (event: { type: string; payload: unknown }) => void;
};

const g = globalThis as unknown as { __tempoListeners?: Set<Listener> };

export function getListeners(): Set<Listener> {
  if (!g.__tempoListeners) g.__tempoListeners = new Set();
  return g.__tempoListeners;
}

export function addListener(listener: Listener) {
  getListeners().add(listener);
}

export function removeListener(listener: Listener) {
  getListeners().delete(listener);
}

/** Fan out an event only to streams belonging to `userId`. */
export function broadcast(userId: string, type: string, payload: unknown) {
  for (const l of getListeners()) {
    if (l.userId !== userId) continue;
    try {
      l.send({ type, payload });
    } catch {
      // listener already disconnected
    }
  }
}

export async function getEmails(userId: string): Promise<Email[]> {
  await ready();
  const { rows } = await getPool().query(
    "SELECT * FROM emails WHERE tenant_id = $1 ORDER BY received_at DESC",
    [userId],
  );
  return rows.map(rowToEmail);
}

export async function getEvents(userId: string): Promise<CalendarEvent[]> {
  await ready();
  const { rows } = await getPool().query(
    "SELECT * FROM events WHERE tenant_id = $1 ORDER BY start_at",
    [userId],
  );
  return rows.map(rowToEvent);
}

/** Inserts and broadcasts. Returns false if the id already existed. */
export async function addEmail(userId: string, email: Email): Promise<boolean> {
  await ready();
  const inserted = await insertEmail(userId, email);
  if (inserted) broadcast(userId, "email.new", email);
  return inserted;
}

export async function updateEmail(
  userId: string,
  id: string,
  patch: Partial<Email>,
): Promise<Email | undefined> {
  await ready();
  const sets: string[] = [];
  const vals: unknown[] = [id, userId];
  const map: Partial<Record<keyof Email, string>> = {
    unread: "unread",
    archived: "archived",
    snoozedUntil: "snoozed_until",
    priority: "priority",
    priorityReason: "priority_reason",
    scheduledEventId: "scheduled_event_id",
  };
  for (const [key, col] of Object.entries(map)) {
    if (key in patch) {
      vals.push(patch[key as keyof Email] ?? null);
      sets.push(`${col} = $${vals.length}`);
    }
  }
  if (!sets.length) return undefined;
  const { rows } = await getPool().query(
    `UPDATE emails SET ${sets.join(", ")} WHERE id = $1 AND tenant_id = $2 RETURNING *`,
    vals,
  );
  if (!rows[0]) return undefined;
  const email = rowToEmail(rows[0]);
  broadcast(userId, "email.updated", email);
  return email;
}

export async function addEvent(
  userId: string,
  event: CalendarEvent,
): Promise<boolean> {
  await ready();
  const inserted = await insertEvent(userId, event);
  if (inserted) broadcast(userId, "event.new", event);
  return inserted;
}

export async function hasEmail(userId: string, id: string): Promise<boolean> {
  await ready();
  const { rows } = await getPool().query(
    "SELECT 1 FROM emails WHERE id = $1 AND tenant_id = $2",
    [id, userId],
  );
  return rows.length > 0;
}
