import { getListeners } from "@/server/store";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream. Corsair webhooks (/api/webhooks/corsair) and
 * any server-side write broadcast into this stream, so connected browsers
 * update in realtime without polling.
 */
export async function GET() {
  const listeners = getListeners();
  const encoder = new TextEncoder();

  let listener: ((e: { type: string; payload: unknown }) => void) | null = null;
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

      listener = (e) => send(e.type, e.payload);
      listeners.add(listener);
      send("connected", { at: new Date().toISOString() });

      heartbeat = setInterval(() => send("ping", {}), 25_000);
    },
    cancel() {
      if (listener) getListeners().delete(listener);
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
