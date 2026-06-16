import { NextResponse } from "next/server";
import { isConnected } from "@/server/corsair";
import { initialSync } from "@/server/sync";
import { getUserId } from "@/server/session";

export async function POST() {
  const userId = await getUserId();
  if (!(await isConnected(userId))) {
    return NextResponse.json({ error: "Not connected" }, { status: 403 });
  }
  try {
    const counts = await initialSync(userId!);
    return NextResponse.json(counts);
  } catch (err) {
    const msg =
      err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    console.error("manual sync failed", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
