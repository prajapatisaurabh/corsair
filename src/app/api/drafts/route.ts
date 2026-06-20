import { NextRequest, NextResponse } from "next/server";
import { isConnected } from "@/server/corsair";
import { getUserId } from "@/server/session";
import { errorResponse } from "@/server/http";

// POST /api/drafts — save a reply as a real Gmail draft { to, subject, body, threadId?, inReplyTo? }
// Unlike /api/emails POST (which sends), this leaves the message in Gmail's
// Drafts folder for the user to review/edit/send from any Gmail client.
export async function POST(req: NextRequest) {
  const userId = await getUserId();
  if (!userId) return errorResponse("Please sign in.", 401);

  const { to, subject, body, threadId, inReplyTo } = await req.json();

  if (!(await isConnected(userId))) {
    // No Google account connected — nothing to save into.
    return errorResponse("Connect Gmail to save drafts.", 409);
  }

  try {
    const { getTenant } = await import("@/server/corsair");
    const corsair = await getTenant(userId);
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/plain; charset=utf-8",
    ];
    if (inReplyTo) {
      headers.push(`In-Reply-To: <${inReplyTo}>`, `References: <${inReplyTo}>`);
    }
    const raw = Buffer.from(`${headers.join("\r\n")}\r\n\r\n${body}`).toString(
      "base64url",
    );
    const draft = await corsair.gmail.api.drafts.create({
      userId: "me",
      draft: { message: { raw, ...(threadId ? { threadId } : {}) } },
    });
    return NextResponse.json({ ok: true, id: draft?.id });
  } catch (err) {
    console.error("corsair gmail.drafts.create failed", err);
    return errorResponse(err, 502);
  }
}
