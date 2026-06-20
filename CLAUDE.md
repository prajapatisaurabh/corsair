# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # dev server on http://localhost:3456 (note: NOT 3000)
npm run build    # next build (output: "standalone")
npm start        # runs the standalone build: node .next/standalone/server.js
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
npm run clean    # rm -rf .next
npm run mcp      # run the Gmail/Calendar MCP server over stdio (see docs/MCP.md)
```

There is no test suite. Use `npm run lint` and `npm run build` to validate changes.

## Environment

Only `DATABASE_URL` (Postgres/Neon) and `APP_URL` are required. The rest gate optional capabilities:

- `DATABASE_URL` — required. App tables + Corsair tables share one pool.
- `CORSAIR_KEK` + `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — together enable **live mode** (real Gmail/Calendar via Corsair OAuth). `oauthConfigured()` checks all three.
- `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) — enables LLM agent planning, AI reply drafts, and LLM priority classification. Without either, deterministic offline fallbacks run.
- `OPENAI_MODEL` / `ANTHROPIC_MODEL` — override default models (`gpt-4o-mini` / `claude-haiku-4-5-20251001`).

## Architecture

Tempo is a keyboard-first Gmail + Google Calendar client ("email that thinks in time"). All Gmail/Calendar plumbing goes through the **Corsair SDK**; the app's own data lives in the same Postgres database.

### Live mode vs. demo/offline mode

Nearly every server module degrades gracefully when keys are missing. This dual-mode design is the single most important thing to preserve:

- **Corsair not configured** (`oauthConfigured()` false) → no live Gmail/Calendar; the app runs on whatever is in Postgres. `isConnected(userId)` returns false; the webhook replies `{ mode: "demo" }`.
- **No LLM key** → `classifyPriority` uses a regex heuristic, `planCommand` uses `planOffline` (a chrono-node + regex command parser in `src/server/agent.ts`), `draftReply` uses templates.

When editing these modules, keep the fallback path working — don't make an LLM/Corsair key a hard requirement.

### Multi-tenancy (critical invariant)

Every user is isolated by a `userId` that is **both** the session cookie value **and** the Corsair tenant id.

- `src/server/session.ts` — mints a random `httpOnly` cookie (`tempo_uid`); `getUserId()` / `getOrCreateUserId()`.
- That same id is passed to `corsair.withTenant(userId)` (see `getTenant` in `src/server/corsair.ts`) so each user's encrypted Google tokens and cached entities are isolated.
- Every app-table query is scoped `WHERE tenant_id = $1`. **Never** write a query, `DELETE`, or `TRUNCATE` that crosses tenants — `db.ts`/`store.ts`/`sync.ts` have explicit comments about this; the schema migration even purges pre-tenancy rows as a leak fix.
- SSE broadcasts (`broadcast(userId, ...)` in `src/server/store.ts`) fan out only to listeners with a matching `userId`.

When adding any data path, thread `userId` through and scope by it.

### Data + realtime flow

```
Google OAuth (Corsair)  ─┐
Corsair webhook (new mail)├─→ classify (Haiku/heuristic) ─→ time-intent (chrono)
manual /api/sync backfill ┘        │
                                   ▼
                          Postgres (emails/events, scoped by tenant_id)
                                   │  every write calls broadcast(userId, …)
                                   ▼
                          SSE /api/stream ─→ zustand store ─→ UI (no polling)
```

- **`src/server/corsair.ts`** — lazy singleton Corsair client. `getCorsair()` provisions integration-level OAuth creds once per process; per-tenant accounts are created on demand in the OAuth callback. All Gmail/Calendar calls MUST go through `getTenant(userId)`.
- **`src/server/db.ts`** — owns the pool and the full schema (app tables **and** the official Corsair tables `corsair_integrations/accounts/entities/events`). `ready()` runs `init()` once per process; schema is `CREATE TABLE IF NOT EXISTS` + idempotent `ALTER`s. Also holds `rowToEmail`/`rowToEvent` mappers and user-profile helpers.
- **`src/server/store.ts`** — tenant-scoped read/write helpers over the pool; insert/update helpers call `broadcast` so any server-side mutation pushes to the browser over SSE. The SSE listener set lives on `globalThis` to survive HMR.
- **`src/server/sync.ts`** — initial backfill after connect: latest 15 inbox messages + next 14 days of events, each run through classify + time-intent. Includes the Gmail/GCal → app-model mappers (`gmailToEmail`, `extractBody`, `gcalToEvent`).
- **`src/server/classify.ts`** / **`time-intent.ts`** — priority lane assignment and "this email implies a time" detection (chrono-node), feeding the amber ⏰ schedule chip.
- **`src/server/agent.ts`** — ⌘K command palette planner and reply drafter. `planCommand` returns a previewable `AgentPlan` (`{ reply, actions[] }`); the client previews it and only executes on Enter via `runPlan`.

### Frontend

- **`src/lib/store.ts`** — single zustand store (`useTempo`) holding all client state and the action methods (archive/snooze/schedule/reply/runPlan/undo). Mutations are optimistic (update local state, then `fetch` the API). `connectStream()` opens the `EventSource` and auto-reconnects. `visibleEmails()` is the canonical inbox filter+sort (not archived, not snoozed-into-future, priority-ranked).
- **`src/app/app/page.tsx`** — the app shell; owns the global keyboard map (J/K navigate, ↵ open, E archive, S schedule, R AI-reply, H snooze, T triage, ⌘K palette, U undo, 0–3 lanes). Components in `src/components/` are presentational + dispatch into the store.
- **API routes** (`src/app/api/*`) are thin: resolve `userId`, call a `src/server/*` function, return JSON. PATCH/POST routes also mirror the change to Gmail/Calendar via Corsair when the user is connected (e.g. archive → remove `INBOX` label). `/api/events` POST runs `findFreeSlot` to slide a booking to the next free business-hours gap if the requested slot is busy.

### MCP server

`scripts/mcp-server.mjs` builds a Corsair instance against the **same** Postgres and exposes the connected account's Gmail/Calendar as MCP tools (`@corsair-dev/mcp`'s `runStdioMcpServer`), scoped to `MCP_TENANT_ID` (a user's `userId` from `/api/me`). See `docs/MCP.md`.
