import "server-only";
import { Email, CalendarEvent } from "@/lib/types";
import { getPool, ready, rowToEmail, rowToEvent, insertEmail, insertEvent } from "./db";

/**
 * Postgres-backed store. Reads/writes go to the database; the SSE listener
 * set stays in-process (kept on globalThis across HMR) so writes fan out
 * to connected browsers immediately.
 */

type Listener = (event: { type: string; payload: unknown }) => void;

const g = globalThis as unknown as { __tempoListeners?: Set<Listener> };

export function getListeners(): Set<Listener> {
  if (!g.__tempoListeners) g.__tempoListeners = new Set();
  return g.__tempoListeners;
}

export function broadcast(type: string, payload: unknown) {
  for (const fn of getListeners()) {
    try {
      fn({ type, payload });
    } catch {
      // listener already disconnected
    }
  }
}

export async function getEmails(): Promise<Email[]> {
  await ready();
  const { rows } = await getPool().query("SELECT * FROM emails ORDER BY received_at DESC");
  return rows.map(rowToEmail);
}

export async function getEvents(): Promise<CalendarEvent[]> {
  await ready();
  const { rows } = await getPool().query("SELECT * FROM events ORDER BY start_at");
  return rows.map(rowToEvent);
}

/** Inserts and broadcasts. Returns false if the id already existed. */
export async function addEmail(email: Email): Promise<boolean> {
  await ready();
  const inserted = await insertEmail(email);
  if (inserted) broadcast("email.new", email);
  return inserted;
}

export async function updateEmail(id: string, patch: Partial<Email>): Promise<Email | undefined> {
  await ready();
  const sets: string[] = [];
  const vals: unknown[] = [id];
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
    `UPDATE emails SET ${sets.join(", ")} WHERE id = $1 RETURNING *`,
    vals
  );
  if (!rows[0]) return undefined;
  const email = rowToEmail(rows[0]);
  broadcast("email.updated", email);
  return email;
}

export async function addEvent(event: CalendarEvent): Promise<boolean> {
  await ready();
  const inserted = await insertEvent(event);
  if (inserted) broadcast("event.new", event);
  return inserted;
}

export async function hasEmail(id: string): Promise<boolean> {
  await ready();
  const { rows } = await getPool().query("SELECT 1 FROM emails WHERE id = $1", [id]);
  return rows.length > 0;
}
