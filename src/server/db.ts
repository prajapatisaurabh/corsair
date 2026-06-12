import "server-only";
import { Pool } from "pg";
import { Email, CalendarEvent } from "@/lib/types";
import { buildMockData } from "@/lib/mock-data";

/**
 * Postgres layer. One pool serves both our app tables and the Corsair SDK
 * (corsair accepts a pg Pool directly). Schema is created and demo data
 * seeded on first connection.
 */

const g = globalThis as unknown as {
  __tempoPool?: Pool;
  __tempoReady?: Promise<void>;
};

export function getPool(): Pool {
  if (!g.__tempoPool) {
    g.__tempoPool = new Pool({
      connectionString:
        process.env.DATABASE_URL ?? "postgres://tempo:tempo@localhost:5432/tempo",
      max: 10,
    });
  }
  return g.__tempoPool;
}

/** Resolves once schema exists and seed data is present. Runs once per process. */
export function ready(): Promise<void> {
  if (!g.__tempoReady) g.__tempoReady = init();
  return g.__tempoReady;
}

async function init() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emails (
      id                 text PRIMARY KEY,
      thread_id          text NOT NULL,
      from_name          text NOT NULL,
      from_email         text NOT NULL,
      to_emails          text[] NOT NULL DEFAULT '{}',
      subject            text NOT NULL,
      snippet            text NOT NULL DEFAULT '',
      body               text NOT NULL DEFAULT '',
      received_at        timestamptz NOT NULL,
      unread             boolean NOT NULL DEFAULT true,
      archived           boolean NOT NULL DEFAULT false,
      snoozed_until      timestamptz,
      priority           text NOT NULL DEFAULT 'normal',
      priority_reason    text,
      time_intent        jsonb,
      scheduled_event_id text,
      labels             text[] NOT NULL DEFAULT '{inbox}'
    );

    CREATE TABLE IF NOT EXISTS events (
      id              text PRIMARY KEY,
      title           text NOT NULL,
      start_at        timestamptz NOT NULL,
      end_at          timestamptz NOT NULL,
      attendees       text[] NOT NULL DEFAULT '{}',
      location        text,
      source_email_id text,
      color           text
    );

    CREATE INDEX IF NOT EXISTS emails_received_idx ON emails (received_at DESC);
    CREATE INDEX IF NOT EXISTS events_start_idx ON events (start_at);
  `);

  const { rows } = await pool.query("SELECT count(*)::int AS n FROM emails");
  if (rows[0].n === 0) {
    const { emails, events } = buildMockData();
    for (const e of emails) await insertEmail(e);
    for (const ev of events) await insertEvent(ev);
  }
}

// ── row mapping ────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToEmail(r: any): Email {
  return {
    id: r.id,
    threadId: r.thread_id,
    from: { name: r.from_name, email: r.from_email },
    to: r.to_emails,
    subject: r.subject,
    snippet: r.snippet,
    body: r.body,
    receivedAt: r.received_at.toISOString(),
    unread: r.unread,
    archived: r.archived,
    snoozedUntil: r.snoozed_until?.toISOString(),
    priority: r.priority,
    priorityReason: r.priority_reason ?? undefined,
    timeIntent: r.time_intent ?? undefined,
    scheduledEventId: r.scheduled_event_id ?? undefined,
    labels: r.labels,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function rowToEvent(r: any): CalendarEvent {
  return {
    id: r.id,
    title: r.title,
    start: r.start_at.toISOString(),
    end: r.end_at.toISOString(),
    attendees: r.attendees,
    location: r.location ?? undefined,
    sourceEmailId: r.source_email_id ?? undefined,
    color: r.color ?? undefined,
  };
}

export async function insertEmail(e: Email): Promise<boolean> {
  const res = await getPool().query(
    `INSERT INTO emails (id, thread_id, from_name, from_email, to_emails, subject,
       snippet, body, received_at, unread, archived, snoozed_until, priority,
       priority_reason, time_intent, scheduled_event_id, labels)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (id) DO NOTHING`,
    [
      e.id, e.threadId, e.from.name, e.from.email, e.to, e.subject,
      e.snippet, e.body, e.receivedAt, e.unread, e.archived,
      e.snoozedUntil ?? null, e.priority, e.priorityReason ?? null,
      e.timeIntent ? JSON.stringify(e.timeIntent) : null,
      e.scheduledEventId ?? null, e.labels,
    ]
  );
  return (res.rowCount ?? 0) > 0;
}

export async function insertEvent(ev: CalendarEvent): Promise<boolean> {
  const res = await getPool().query(
    `INSERT INTO events (id, title, start_at, end_at, attendees, location, source_email_id, color)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     ON CONFLICT (id) DO NOTHING`,
    [
      ev.id, ev.title, ev.start, ev.end, ev.attendees,
      ev.location ?? null, ev.sourceEmailId ?? null, ev.color ?? null,
    ]
  );
  return (res.rowCount ?? 0) > 0;
}
