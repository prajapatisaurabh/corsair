import { NextResponse } from "next/server";
import { isConnected } from "@/server/corsair";
import { initialSync } from "@/server/sync";
import { getUserId } from "@/server/session";
import { errorResponse } from "@/server/http";

export async function POST() {
  const userId = await getUserId();
  if (!(await isConnected(userId))) {
    return errorResponse("Connect your Google account first.", 403);
  }
  try {
    const counts = await initialSync(userId!);
    return NextResponse.json(counts);
  } catch (err) {
    console.error("manual sync failed", err);
    return errorResponse(err, 500);
  }
}
