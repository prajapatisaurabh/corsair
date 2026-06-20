import { NextRequest, NextResponse } from "next/server";
import { getEmails, updateEmail, broadcast } from "@/server/store";
import { isConnected } from "@/server/corsair";
import { getUserId } from "@/server/session";
import { errorResponse } from "@/server/http";

export async function GET() {
  const userId = await getUserId();
  if (!userId) return NextResponse.json({ emails: [], live: false });
  const emails = await getEmails(userId);
  return NextResponse.json({ emails, live: await isConnected(userId) });
}

// PATCH /api/emails — { id, ...patch } for archive / snooze / read state
export async function PATCH(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return errorResponse("Please sign in.", 401);

  const { id, ...patch } = await req.json();
  const email = await updateEmail(userId, id, patch);
  if (!email) return errorResponse("That email no longer exists.", 404);

  if (await isConnected(userId)) {
    // Mirror the change to Gmail via Corsair (archive => remove INBOX label).
    try {
      const { getTenant } = await import("@/server/corsair");
      const corsair = await getTenant(userId);
      if (patch.archived === true) {
        await corsair.gmail.api.messages.modify({
          userId: "me",
          id,
          removeLabelIds: ["INBOX"],
        });
      }
      if (patch.archived === false) {
        // Undo: put the message back in the inbox.
        await corsair.gmail.api.messages.modify({
          userId: "me",
          id,
          addLabelIds: ["INBOX"],
        });
      }
      if (patch.unread === false) {
        await corsair.gmail.api.messages.modify({
          userId: "me",
          id,
          removeLabelIds: ["UNREAD"],
        });
      }
    } catch (err) {
      console.error("corsair gmail.messages.modify failed", err);
    }
  }
  return NextResponse.json({ email });
}

// POST /api/emails — send an email { to, subject, body }
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return errorResponse("Please sign in.", 401);

  const { to, subject, body, threadId, inReplyTo } = await req.json();

  if (await isConnected(userId)) {
    try {
      const { getTenant } = await import("@/server/corsair");
      const corsair = await getTenant(userId);
      // RFC-2822 headers. In-Reply-To / References make Gmail thread the reply
      // under the original conversation (threadId alone is not enough).
      const headers = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=utf-8",
      ];
      if (inReplyTo) {
        headers.push(
          `In-Reply-To: <${inReplyTo}>`,
          `References: <${inReplyTo}>`,
        );
      }
      const raw = Buffer.from(
        `${headers.join("\r\n")}\r\n\r\n${body}`,
      ).toString("base64url");
      await corsair.gmail.api.messages.send({
        userId: "me",
        raw,
        ...(threadId ? { threadId } : {}),
      });
    } catch (err) {
      console.error("corsair gmail.messages.send failed", err);
      return errorResponse(err, 502);
    }
  }

  broadcast(userId, "email.sent", { to, subject });
  return NextResponse.json({ ok: true, sent: { to, subject, body } });
}
