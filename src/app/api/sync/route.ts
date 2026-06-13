import { NextResponse } from "next/server";
import { isConnected } from "@/server/corsair";
import { initialSync } from "@/server/sync";

export async function POST() {
  if (!(await isConnected())) {
    return NextResponse.json({ error: "Not connected" }, { status: 403 });
  }
  try {
    const counts = await initialSync();
    return NextResponse.json(counts);
  } catch (err) {
    const msg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
    console.error("manual sync failed", err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
