import { NextRequest, NextResponse } from "next/server";
import { getEvents, addEvent, updateEmail } from "@/server/store";
import { isConnected } from "@/server/corsair";
import { getUserId } from "@/server/session";
import { errorResponse } from "@/server/http";
import { CalendarEvent } from "@/lib/types";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ events: [], live: false });
  const events = await getEvents(userId);
  return NextResponse.json({ events, live: await isConnected(userId) });
}

const DAY_START_HOUR = 7;
const DAY_END_HOUR = 22;
const STEP_MS = 15 * 60_000;

type Busy = { start: number; end: number };

function overlaps(start: number, end: number, busy: Busy[]): boolean {
  return busy.some((b) => start < b.end && end > b.start);
}

function withinHours(start: number, end: number): boolean {
  const s = new Date(start);
  const e = new Date(end);
  return (
    s.getHours() >= DAY_START_HOUR &&
    (e.getHours() < DAY_END_HOUR ||
      (e.getHours() === DAY_END_HOUR && e.getMinutes() === 0))
  );
}

/**
 * Scan forward from `start` (in 15-min steps, business hours only) for the
 * first gap of `durationMs` that doesn't collide with `busy`. Returns the
 * original start if it's already free, or null if nothing opens up in 7 days.
 */
function findFreeSlot(
  startMs: number,
  durationMs: number,
  busy: Busy[],
): number | null {
  if (!overlaps(startMs, startMs + durationMs, busy)) return startMs;
  const limit = startMs + 7 * 86400_000;
  for (let t = startMs; t < limit; t += STEP_MS) {
    const end = t + durationMs;
    if (withinHours(t, end) && !overlaps(t, end, busy)) return t;
  }
  return null;
}

// POST /api/events — create event { title, start, end, attendees, sourceEmailId? }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return errorResponse("Please sign in.", 401);

  const body = await req.json();
  const event: CalendarEvent = {
    id: `ev-${Date.now()}`,
    title: body.title,
    start: body.start,
    end: body.end,
    attendees: body.attendees ?? [],
    location: body.location,
    sourceEmailId: body.sourceEmailId,
    color: body.sourceEmailId ? "amber" : "violet",
  };

  // ISO of the originally-requested slot, before any conflict shift.
  let shiftedFrom: string | null = null;

  if (await isConnected(userId)) {
    try {
      const { getTenant } = await import("@/server/corsair");
      const corsair = await getTenant(userId);

      // ── Conflict check: ask Google for real busy blocks and, if the
      // requested slot is taken, slide to the next free one. ──────────────
      const startMs = new Date(event.start).getTime();
      const durationMs = new Date(event.end).getTime() - startMs;
      try {
        const avail = await corsair.googlecalendar.api.calendar.getAvailability(
          {
            timeMin: new Date(startMs).toISOString(),
            timeMax: new Date(startMs + 7 * 86400_000).toISOString(),
            items: [{ id: "primary" }],
          },
        );
        const rawBusy = (avail?.calendars?.primary?.busy ?? []) as Array<{
          start?: string;
          end?: string;
        }>;
        const busy: Busy[] = rawBusy
          .filter(
            (b): b is { start: string; end: string } => !!b.start && !!b.end,
          )
          .map((b) => ({
            start: new Date(b.start).getTime(),
            end: new Date(b.end).getTime(),
          }));
        const free = findFreeSlot(startMs, durationMs, busy);
        if (free !== null && free !== startMs) {
          shiftedFrom = event.start;
          event.start = new Date(free).toISOString();
          event.end = new Date(free + durationMs).toISOString();
        }
      } catch (err) {
        // Availability is best-effort — never block scheduling on it.
        console.error(
          "corsair getAvailability failed (scheduling anyway)",
          err,
        );
      }

      const created = await corsair.googlecalendar.api.events.create({
        calendarId: "primary",
        event: {
          summary: event.title,
          start: { dateTime: event.start },
          end: { dateTime: event.end },
          attendees: event.attendees.map((email: string) => ({ email })),
        },
        sendUpdates: "all",
      });
      if (created?.id) event.id = created.id;
    } catch (err) {
      console.error("corsair googlecalendar.events.create failed", err);
      return errorResponse(err, 502);
    }
  }

  await addEvent(userId, event);
  if (event.sourceEmailId) {
    await updateEmail(userId, event.sourceEmailId, {
      scheduledEventId: event.id,
      archived: true,
    });
  }
  return NextResponse.json({ event, shiftedFrom });
}
