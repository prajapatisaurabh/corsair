import { NextRequest, NextResponse } from "next/server";
import { getEmails, updateEmail, broadcast } from "@/server/store";
import { isConnected } from "@/server/corsair";

export async function GET() {
  const emails = await getEmails();
  return NextResponse.json({ emails, live: await isConnected() });
}

// PATCH /api/emails — { id, ...patch } for archive / snooze / read state
export async function PATCH(req: NextRequest) {
  const { id, ...patch } = await req.json();
  const email = await updateEmail(id, patch);
  if (!email) return NextResponse.json({ error: "not found" }, { status: 404 });

  if (await isConnected()) {
    // Mirror the change to Gmail via Corsair (archive => remove INBOX label).
    try {
      const { getCorsair } = await import("@/server/corsair");
      const corsair = await getCorsair();
      if (patch.archived) {
        await corsair.gmail.messages.modify({ userId: "me", id, removeLabelIds: ["INBOX"] });
      }
      if (patch.unread === false) {
        await corsair.gmail.messages.modify({ userId: "me", id, removeLabelIds: ["UNREAD"] });
      }
    } catch (err) {
      console.error("corsair gmail.messages.modify failed", err);
    }
  }
  return NextResponse.json({ email });
}

// POST /api/emails — send an email { to, subject, body }
export async function POST(req: NextRequest) {
  const { to, subject, body } = await req.json();

  if (await isConnected()) {
    try {
      const { getCorsair } = await import("@/server/corsair");
      const corsair = await getCorsair();
      const raw = Buffer.from(
        `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=utf-8\r\n\r\n${body}`
      ).toString("base64url");
      await corsair.gmail.messages.send({ userId: "me", raw });
    } catch (err) {
      console.error("corsair gmail.messages.send failed", err);
      return NextResponse.json({ error: "send failed" }, { status: 502 });
    }
  }

  broadcast("email.sent", { to, subject });
  return NextResponse.json({ ok: true, sent: { to, subject, body } });
}
