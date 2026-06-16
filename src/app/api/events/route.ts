import { NextRequest, NextResponse } from "next/server";
import { getEvents, addEvent, updateEmail } from "@/server/store";
import { isConnected } from "@/server/corsair";
import { getUserId } from "@/server/session";
import { CalendarEvent } from "@/lib/types";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ events: [], live: false });
  const events = await getEvents(userId);
  return NextResponse.json({ events, live: await isConnected(userId) });
}

// POST /api/events — create event { title, start, end, attendees, sourceEmailId? }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

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

  if (await isConnected(userId)) {
    try {
      const { getTenant } = await import("@/server/corsair");
      const corsair = await getTenant(userId);
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
      return NextResponse.json({ error: "create failed" }, { status: 502 });
    }
  }

  await addEvent(userId, event);
  if (event.sourceEmailId) {
    await updateEmail(userId, event.sourceEmailId, {
      scheduledEventId: event.id,
      archived: true,
    });
  }
  return NextResponse.json({ event });
}
