import "server-only";
import { Email, CalendarEvent } from "@/lib/types";
import { getCorsair } from "./corsair";
import { getPool } from "./db";
import { addEmail, addEvent, broadcast } from "./store";
import { classifyPriority } from "./classify";
import { detectTimeIntent } from "./time-intent";

/**
 * Initial backfill after Google connect: replace demo data with the user's
 * real inbox (latest messages) and upcoming calendar events.
 */
export async function initialSync(): Promise<{
  emails: number;
  events: number;
}> {
  const corsair = await getCorsair();

  // Demo data out — the timeline becomes fully real from here.
  await getPool().query("TRUNCATE emails, events");

  let emailCount = 0;
  let eventCount = 0;

  // ── Gmail: latest 15 inbox messages ──────────────────────────────────
  const list = await corsair.gmail.api.messages.list({
    userId: "me",
    labelIds: ["INBOX"],
    maxResults: 15,
  });
  for (const ref of list?.messages ?? []) {
    try {
      const msg = await corsair.gmail.api.messages.get({
        userId: "me",
        id: ref.id,
        format: "full",
      });
      const email = await gmailToEmail(msg);
      if (await addEmail(email)) emailCount++;
    } catch (err) {
      console.error("sync: failed to import message", ref.id, err);
    }
  }

  // ── Calendar: next 14 days ───────────────────────────────────────────
  const now = new Date();
  const events = await corsair.googlecalendar.api.events.getMany({
    calendarId: "primary",
    timeMin: now.toISOString(),
    timeMax: new Date(now.getTime() + 14 * 86400_000).toISOString(),
    singleEvents: true,
    orderBy: "startTime",
    maxResults: 50,
  });
  for (const item of events?.items ?? []) {
    const ev = gcalToEvent(item);
    if (ev && (await addEvent(ev))) eventCount++;
  }

  broadcast("sync.done", { emails: emailCount, events: eventCount });
  return { emails: emailCount, events: eventCount };
}

// ── mappers ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function gmailToEmail(msg: any): Promise<Email> {
  const headers: Record<string, string> = {};
  for (const h of msg?.payload?.headers ?? [])
    headers[h.name?.toLowerCase()] = h.value;

  const subject = headers["subject"] ?? "(no subject)";
  const fromRaw = headers["from"] ?? "unknown@unknown.com";
  const fromMatch = fromRaw.match(/^(.*?)\s*<(.+)>$/);
  const body = extractBody(msg?.payload) || msg?.snippet || "";

  return {
    id: msg.id,
    threadId: msg.threadId ?? msg.id,
    from: {
      name: fromMatch?.[1]?.replace(/"/g, "").trim() || fromRaw.split("@")[0],
      email: fromMatch?.[2] ?? fromRaw,
    },
    to: [headers["to"] ?? "me"],
    subject,
    snippet: (msg?.snippet ?? body).slice(0, 140),
    body: body.slice(0, 5000),
    receivedAt: msg.internalDate
      ? new Date(Number(msg.internalDate)).toISOString()
      : new Date().toISOString(),
    unread: (msg.labelIds ?? []).includes("UNREAD"),
    archived: false,
    labels: ["inbox"],
    ...(await classifyPriority(subject, body)),
    timeIntent:
      detectTimeIntent(`${subject} ${body.slice(0, 1000)}`) ?? undefined,
  };
}

/** Walks a Gmail payload tree for the first text/plain part. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBody(payload: any): string {
  if (!payload) return "";
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return Buffer.from(payload.body.data, "base64url").toString("utf8");
  }
  for (const part of payload.parts ?? []) {
    const found = extractBody(part);
    if (found) return found;
  }
  return "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function gcalToEvent(item: any): CalendarEvent | null {
  const start =
    item?.start?.dateTime ??
    (item?.start?.date ? `${item.start.date}T09:00:00` : null);
  const end =
    item?.end?.dateTime ??
    (item?.end?.date ? `${item.end.date}T10:00:00` : null);
  if (!start || !end || !item?.id) return null;
  return {
    id: item.id,
    title: item.summary ?? "(untitled)",
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    attendees: (item.attendees ?? []).map((a: { email: string }) => a.email),
    location: item.location ?? undefined,
    color: "indigo",
  };
}
