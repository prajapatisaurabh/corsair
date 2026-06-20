import { NextRequest, NextResponse } from "next/server";
import { draftReply } from "@/server/agent";
import { errorResponse } from "@/server/http";

// POST /api/draft — { subject, body, senderName } → { draft }
export async function POST(req: NextRequest) {
  try {
    const { subject, body, senderName } = await req.json();
    const draft = await draftReply(
      subject ?? "",
      body ?? "",
      senderName ?? "there",
    );
    return NextResponse.json({ draft });
  } catch (err) {
    console.error("draft generation failed", err);
    return errorResponse(err, 500);
  }
}
