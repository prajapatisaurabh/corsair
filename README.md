# Tempo — email that thinks in time

A Superhuman-style Gmail + Google Calendar client built for the **Corsair Hackathon**.

> Almost every important email is secretly about time — "can we meet Thursday?",
> "deadline Friday", "invoice due Monday". Gmail keeps mail and calendar in
> separate apps. Tempo fuses them into one keyboard-first timeline, powered by
> [Corsair](https://corsair.dev) for all Gmail / Google Calendar plumbing.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. **Demo mode needs zero config** — rich seed data
loads, and a "new email" arrives over the realtime stream ~18s in so you can
show live updates.

## The demo script (≈3 minutes)

1. **Unified timeline** — inbox lanes (Urgent / Normal / Low, AI-classified)
   on the left, your next 3 days on the right. Emails that *mention a time*
   show an amber ⏰ chip and wait in the "to be scheduled" tray.
2. **One-keystroke scheduling** — select Dev Jain's "sync tomorrow at 2pm"
   email, press **S**: it snaps onto the calendar as an event, the invite is
   sent (Corsair → `googlecalendar.events.create`), and the email archives
   itself.
3. **Speed triage** — press **T**: one email at a time, single keys
   (E archive · S schedule · R AI-reply · H snooze), streak counter, timer.
   Inbox zero in under a minute.
4. **Agent palette (Corsair MCP)** — **⌘K**, then the hackathon brief's own
   example: *"Send a calendar invite to dev@corsair.dev at 9 AM next
   Thursday. Send him an email too saying I look forward to our meeting."*
   The agent previews both actions; **Enter** executes them.
5. **Realtime** — around now the Corsair Team email lands live (webhook-fed
   SSE, no polling), pre-classified urgent with its time-intent already
   detected. Press **S** on it. Done.

## Keyboard map

| Key | Action |
|---|---|
| `J/K` or `↑↓` | navigate |
| `↵` | open email |
| `E` | archive |
| `R` | reply with AI draft |
| `S` | schedule time-intent → send invite |
| `H` | snooze 3h |
| `T` | speed-triage mode |
| `⌘K` | agent command palette |
| `0–3` | priority lanes |

## Hackathon checklist

- ✅ Superhuman-style Gmail client (search, draft, send, receive, archive, snooze)
- ✅ Google Calendar: view schedule, create events, send invites
- ✅ **Bonus: agent chat via Corsair MCP** (⌘K palette with action preview)
- ✅ **Bonus: Corsair webhooks** → SSE realtime, no API polling
- ✅ **Bonus: LLM priority filtering** (Claude Haiku; transparent heuristic offline)
- ✅ **Bonus: keyboard-first** everything
- ✅ Plus the twist: time-intent detection → one-keystroke email→event scheduling

## Going live with Corsair

Demo mode runs on an in-memory store. To wire real Gmail/Calendar:

1. `cp .env.example .env` and set `CORSAIR_KEK` (`openssl rand -base64 32`).
2. Create the Corsair tables (SQLite): the SDK's `createCorsairDatabase` /
   docs migration sets up `corsair_integrations`, `corsair_accounts`,
   `corsair_entities`, `corsair_events`.
3. Connect Google OAuth via Corsair's connect link flow (see
   [docs.corsair.dev](https://docs.corsair.dev) → Tenants and auth).
4. Point a Corsair Gmail webhook at `/api/webhooks/corsair` — new mail then
   flows: webhook → classify (Haiku) → time-intent (chrono) → SSE → UI.
5. Optionally set `ANTHROPIC_API_KEY` for Claude-powered palette parsing,
   reply drafts, and priority classification.

The integration points live in:

- `src/server/corsair.ts` — Corsair client (`gmail()`, `googlecalendar()` plugins)
- `src/app/api/emails/route.ts` — `gmail.messages.send / modify`
- `src/app/api/events/route.ts` — `googlecalendar.events.create` (`sendUpdates: all`)
- `src/app/api/webhooks/corsair/route.ts` — realtime ingest

---

Built with Next.js 16, Corsair, chrono-node, zustand, Claude Haiku.

**Builder Mode On | MacBook Giveaway Hackathon** · #chaicode #corsair-dev
