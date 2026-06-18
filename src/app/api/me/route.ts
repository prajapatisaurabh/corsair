import { NextResponse } from "next/server";
import { getUserId } from "@/server/session";
import { isConnected } from "@/server/corsair";

// GET /api/me — your Tempo session/tenant id. Use it as MCP_TENANT_ID when
// running the MCP server (scripts/mcp-server.mjs).
export async function GET() {
  const userId = await getUserId();
  return NextResponse.json({
    userId,
    connected: await isConnected(userId),
  });
}
