import { NextRequest, NextResponse } from "next/server";
import { planCommand } from "@/server/agent";

// POST /api/agent — { command } → { reply, actions } preview plan
export async function POST(req: NextRequest) {
  const { command } = await req.json();
  if (!command?.trim()) {
    return NextResponse.json({ error: "empty command" }, { status: 400 });
  }
  const plan = await planCommand(command);
  return NextResponse.json(plan);
}
