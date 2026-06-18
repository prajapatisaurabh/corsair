import { NextRequest, NextResponse } from "next/server";
import { isConnected } from "@/server/corsair";
import { getUserId } from "@/server/session";
import { extractBody } from "@/server/sync";
import { ThreadMessage } from "@/lib/types";

// GET /api/thread?id=<threadId> — the full Gmail conversation, oldest→newest.
export async function GET(req: NextRequest) {
  const userId = await getUserId();
  if (!userId)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ messages: [] });

  if (!(await isConnected(userId))) {
    // Not connected (e.g. demo) — caller falls back to the single message.
    return NextResponse.json({ messages: [], live: false });
  }

  try {
    const { getTenant } = await import("@/server/corsair");
    const corsair = await getTenant(userId);
    const thread = await corsair.gmail.api.threads.get({
      userId: "me",
      id,
      format: "full",
    });

    const messages: ThreadMessage[] = (thread?.messages ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (msg: any) => {
        const headers: Record<string, string> = {};
        for (const h of msg?.payload?.headers ?? [])
          headers[h.name?.toLowerCase()] = h.value;
        const fromRaw = headers["from"] ?? "unknown@unknown.com";
        const m = fromRaw.match(/^(.*?)\s*<(.+)>$/);
        const body = extractBody(msg?.payload) || msg?.snippet || "";
        return {
          id: msg.id,
          fromName: m?.[1]?.replace(/"/g, "").trim() || fromRaw.split("@")[0],
          fromEmail: m?.[2] ?? fromRaw,
          date: msg.internalDate
            ? new Date(Number(msg.internalDate)).toISOString()
            : new Date().toISOString(),
          body: body.slice(0, 5000),
          snippet: (msg?.snippet ?? "").slice(0, 140),
        };
      },
    );

    return NextResponse.json({ messages, live: true });
  } catch (err) {
    console.error("corsair gmail.threads.get failed", err);
    return NextResponse.json({ messages: [], live: true });
  }
}
