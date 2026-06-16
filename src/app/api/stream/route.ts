import { addListener, removeListener } from "@/server/store";
import { getUserId } from "@/server/session";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream. Corsair webhooks (/api/webhooks/corsair) and any
 * server-side write broadcast into this stream, so connected browsers update
 * in realtime without polling. The stream is bound to the current user, so a
 * browser only receives events for its own tenant.
 */
export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return new Response("data: {}\n\n", {
      status: 401,
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const encoder = new TextEncoder();
  let listener: { userId: string; send: (e: { type: string; payload: unknown }) => void } | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      const send = (type: string, payload: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type, payload })}\n\n`));
        } catch {
          // stream closed
        }
      };

      listener = { userId, send: (e) => send(e.type, e.payload) };
      addListener(listener);
      send("connected", { at: new Date().toISOString() });

      heartbeat = setInterval(() => send("ping", {}), 25_000);
    },
    cancel() {
      if (listener) removeListener(listener);
      if (heartbeat) clearInterval(heartbeat);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
