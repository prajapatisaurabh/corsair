import { NextRequest, NextResponse } from "next/server";
import { getEvents, addEvent, updateEmail } from "@/server/store";
import { isLive } from "@/server/corsair";
import { CalendarEvent } from "@/lib/types";

export async function GET() {
  const events = await getEvents();
  return NextResponse.json({ events, live: isLive() });
}

// POST /api/events — create event { title, start, end, attendees, sourceEmailId? }
export async function POST(req: NextRequest) {
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

  if (isLive()) {
    try {
      const { getCorsair } = await import("@/server/corsair");
      const corsair = await getCorsair();
      const created = await corsair.googlecalendar.events.create({
        calendarId: "primary",
        summary: event.title,
        start: { dateTime: event.start },
        end: { dateTime: event.end },
        attendees: event.attendees.map((email: string) => ({ email })),
        sendUpdates: "all",
      });
      if (created?.id) event.id = created.id;
    } catch (err) {
      console.error("corsair googlecalendar.events.create failed", err);
      return NextResponse.json({ error: "create failed" }, { status: 502 });
    }
  }

  await addEvent(event);
  if (event.sourceEmailId) {
    await updateEmail(event.sourceEmailId, { scheduledEventId: event.id, archived: true });
  }
  return NextResponse.json({ event });
}
