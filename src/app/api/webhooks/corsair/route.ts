import { NextRequest, NextResponse } from "next/server";
import { addEmail } from "@/server/store";
import { isLive } from "@/server/corsair";
import { classifyPriority } from "@/server/classify";
import { detectTimeIntent } from "@/server/time-intent";
import { Email } from "@/lib/types";

/**
 * Corsair webhook receiver (live mode). New Gmail messages arrive here in
 * realtime — no polling — get classified + time-intent parsed, then fan
 * out to connected clients over the SSE stream.
 */
export async function POST(req: NextRequest) {
  if (!isLive()) return NextResponse.json({ ok: true, mode: "demo" });

  const payload = await req.json();
  try {
    const msg = payload?.data ?? payload;
    const headers: Record<string, string> = {};
    for (const h of msg?.payload?.headers ?? []) headers[h.name?.toLowerCase()] = h.value;

    const subject = headers["subject"] ?? "(no subject)";
    const fromRaw = headers["from"] ?? "unknown@unknown.com";
    const fromMatch = fromRaw.match(/^(.*?)\s*<(.+)>$/);
    const body = msg?.snippet ?? "";

    const email: Email = {
      id: msg?.id ?? `wh-${Date.now()}`,
      threadId: msg?.threadId ?? `wh-${Date.now()}`,
      from: {
        name: fromMatch?.[1]?.replace(/"/g, "") || fromRaw.split("@")[0],
        email: fromMatch?.[2] ?? fromRaw,
      },
      to: [headers["to"] ?? "me"],
      subject,
      snippet: body.slice(0, 140),
      body,
      receivedAt: new Date().toISOString(),
      unread: true,
      archived: false,
      labels: ["inbox"],
      ...(await classifyPriority(subject, body)),
      timeIntent: detectTimeIntent(`${subject} ${body}`) ?? undefined,
    };
    await addEmail(email);
  } catch (err) {
    console.error("webhook parse failed", err);
  }
  return NextResponse.json({ ok: true });
}
