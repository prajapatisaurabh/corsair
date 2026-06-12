import "server-only";
import { Email, CalendarEvent } from "@/lib/types";
import { buildMockData } from "@/lib/mock-data";

/**
 * In-memory demo store. Survives across requests within one dev/server
 * process (kept on globalThis so Next.js HMR doesn't reset it).
 * In live mode this acts as the local cache that Corsair webhooks feed.
 */

type Listener = (event: { type: string; payload: unknown }) => void;

interface Store {
  emails: Email[];
  events: CalendarEvent[];
  listeners: Set<Listener>;
  liveEmailSent: boolean;
}

const g = globalThis as unknown as { __tempoStore?: Store };

export function getStore(): Store {
  if (!g.__tempoStore) {
    const { emails, events } = buildMockData();
    g.__tempoStore = { emails, events, listeners: new Set(), liveEmailSent: false };
  }
  return g.__tempoStore;
}

export function broadcast(type: string, payload: unknown) {
  for (const fn of getStore().listeners) {
    try {
      fn({ type, payload });
    } catch {
      // listener already disconnected
    }
  }
}

export function addEmail(email: Email) {
  getStore().emails.unshift(email);
  broadcast("email.new", email);
}

export function updateEmail(id: string, patch: Partial<Email>): Email | undefined {
  const store = getStore();
  const idx = store.emails.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  store.emails[idx] = { ...store.emails[idx], ...patch };
  broadcast("email.updated", store.emails[idx]);
  return store.emails[idx];
}

export function addEvent(event: CalendarEvent) {
  getStore().events.push(event);
  broadcast("event.new", event);
}
