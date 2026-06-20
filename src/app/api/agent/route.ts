import { NextRequest, NextResponse } from "next/server";
import { planCommand } from "@/server/agent";
import { errorResponse } from "@/server/http";

// POST /api/agent — { command } → { reply, actions } preview plan
export async function POST(req: NextRequest) {
  try {
    const { command } = await req.json();
    if (!command?.trim()) {
      return errorResponse("Type a command for the agent to plan.", 400);
    }
    const plan = await planCommand(command);
    return NextResponse.json(plan);
  } catch (err) {
    console.error("agent planning failed", err);
    return errorResponse(err, 500);
  }
}
