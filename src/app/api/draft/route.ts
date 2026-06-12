import { NextRequest, NextResponse } from "next/server";
import { draftReply } from "@/server/agent";

// POST /api/draft — { subject, body, senderName } → { draft }
export async function POST(req: NextRequest) {
  const { subject, body, senderName } = await req.json();
  const draft = await draftReply(subject ?? "", body ?? "", senderName ?? "there");
  return NextResponse.json({ draft });
}
