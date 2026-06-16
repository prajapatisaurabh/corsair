import "server-only";
import { Pool } from "pg";
import { Email, CalendarEvent } from "@/lib/types";

/**
 * Postgres layer. One pool serves both our app tables and the Corsair SDK
 * (corsair accepts a pg Pool directly). Schema is created automatically
 * on first connection.
 */

const g = globalThis as unknown as {
  __tempoPool?: Pool;
  __tempoReady?: Promise<void>;
};

export function getPool(): Pool {
  if (!g.__tempoPool) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL is not set — provide your Neon (or other Postgres) connection string.",
      );
    }
    g.__tempoPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
  }
  return g.__tempoPool;
}

/** Resolves once the schema exists. Runs once per process. */
export function ready(): Promise<void> {
  if (!g.__tempoReady) g.__tempoReady = init();
  return g.__tempoReady;
}

async function init() {
  const pool = getPool();
  await pool.query(`
    CREATE TABLE IF NOT EXISTS emails (
      id                 text PRIMARY KEY,
      tenant_id          text NOT NULL,
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
      tenant_id       text NOT NULL,
      title           text NOT NULL,
      start_at        timestamptz NOT NULL,
      end_at          timestamptz NOT NULL,
      attendees       text[] NOT NULL DEFAULT '{}',
      location        text,
      source_email_id text,
      color           text
    );

    CREATE INDEX IF NOT EXISTS emails_received_idx ON emails (tenant_id, received_at DESC);
    CREATE INDEX IF NOT EXISTS events_start_idx ON events (tenant_id, start_at);

    -- Per-user record. id == the session/tenant id (see server/session.ts).
    CREATE TABLE IF NOT EXISTS users (
      id         text PRIMARY KEY,
      email      text,
      name       text,
      picture    text,
      connected  boolean NOT NULL DEFAULT false,
      created_at timestamptz NOT NULL DEFAULT now()
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key   text PRIMARY KEY,
      value text NOT NULL
    );

    -- Corsair SDK tables (official Postgres migration from docs.corsair.dev)
    CREATE TABLE IF NOT EXISTS corsair_integrations (
      id         TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      name       TEXT NOT NULL,
      config     JSONB NOT NULL DEFAULT '{}',
      dek        TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS corsair_accounts (
      id             TEXT PRIMARY KEY,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      tenant_id      TEXT NOT NULL,
      integration_id TEXT NOT NULL REFERENCES corsair_integrations(id),
      config         JSONB NOT NULL DEFAULT '{}',
      dek            TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS corsair_entities (
      id          TEXT PRIMARY KEY,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      account_id  TEXT NOT NULL REFERENCES corsair_accounts(id),
      entity_id   TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      version     TEXT NOT NULL,
      data        JSONB NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS corsair_events (
      id         TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      account_id TEXT NOT NULL REFERENCES corsair_accounts(id),
      event_type TEXT NOT NULL,
      payload    JSONB NOT NULL DEFAULT '{}',
      status     TEXT
    );
  `);

  // Migration for databases created before multi-tenancy: add the tenant_id
  // column and purge any pre-tenancy rows (they belonged to no user and were
  // visible to everyone — exactly the leak we're closing).
  await pool.query(`
    ALTER TABLE emails ADD COLUMN IF NOT EXISTS tenant_id text;
    ALTER TABLE events ADD COLUMN IF NOT EXISTS tenant_id text;
    ALTER TABLE users  ADD COLUMN IF NOT EXISTS name text;
    DELETE FROM emails WHERE tenant_id IS NULL;
    DELETE FROM events WHERE tenant_id IS NULL;
  `);
}

// ── per-user state (replaces the old global app_settings keys) ───────────

export async function isUserConnected(userId: string): Promise<boolean> {
  await ready();
  const { rows } = await getPool().query(
    "SELECT connected FROM users WHERE id = $1",
    [userId],
  );
  return rows[0]?.connected === true;
}

export async function markUserConnected(userId: string): Promise<void> {
  await ready();
  await getPool().query(
    `INSERT INTO users (id, connected) VALUES ($1, true)
     ON CONFLICT (id) DO UPDATE SET connected = true`,
    [userId],
  );
}

export async function getUserProfile(
  userId: string,
): Promise<{ email: string | null; name: string | null; picture: string | null }> {
  await ready();
  const { rows } = await getPool().query(
    "SELECT email, name, picture FROM users WHERE id = $1",
    [userId],
  );
  return {
    email: rows[0]?.email ?? null,
    name: rows[0]?.name ?? null,
    picture: rows[0]?.picture ?? null,
  };
}

export async function setUserProfile(
  userId: string,
  email: string | null,
  picture: string | null,
  name: string | null = null,
): Promise<void> {
  await ready();
  await getPool().query(
    `INSERT INTO users (id, email, picture, name) VALUES ($1, $2, $3, $4)
     ON CONFLICT (id) DO UPDATE SET email = $2, picture = $3, name = $4`,
    [userId, email, picture, name],
  );
}

/** Removes all of a user's app data (used on logout). */
export async function deleteUserData(userId: string): Promise<void> {
  await ready();
  const pool = getPool();
  await pool.query("DELETE FROM emails WHERE tenant_id = $1", [userId]);
  await pool.query("DELETE FROM events WHERE tenant_id = $1", [userId]);
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
  await pool.query("DELETE FROM corsair_accounts WHERE tenant_id = $1", [
    userId,
  ]);
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

export async function insertEmail(userId: string, e: Email): Promise<boolean> {
  const res = await getPool().query(
    `INSERT INTO emails (id, tenant_id, thread_id, from_name, from_email, to_emails, subject,
       snippet, body, received_at, unread, archived, snoozed_until, priority,
       priority_reason, time_intent, scheduled_event_id, labels)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
     ON CONFLICT (id) DO NOTHING`,
    [
      e.id,
      userId,
      e.threadId,
      e.from.name,
      e.from.email,
      e.to,
      e.subject,
      e.snippet,
      e.body,
      e.receivedAt,
      e.unread,
      e.archived,
      e.snoozedUntil ?? null,
      e.priority,
      e.priorityReason ?? null,
      e.timeIntent ? JSON.stringify(e.timeIntent) : null,
      e.scheduledEventId ?? null,
      e.labels,
    ],
  );
  return (res.rowCount ?? 0) > 0;
}

export async function insertEvent(
  userId: string,
  ev: CalendarEvent,
): Promise<boolean> {
  const res = await getPool().query(
    `INSERT INTO events (id, tenant_id, title, start_at, end_at, attendees, location, source_email_id, color)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (id) DO NOTHING`,
    [
      ev.id,
      userId,
      ev.title,
      ev.start,
      ev.end,
      ev.attendees,
      ev.location ?? null,
      ev.sourceEmailId ?? null,
      ev.color ?? null,
    ],
  );
  return (res.rowCount ?? 0) > 0;
}
