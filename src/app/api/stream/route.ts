import { getStore, addEmail } from "@/server/store";
import { buildLiveDemoEmail } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events stream. In live mode, Corsair webhooks
 * (/api/webhooks/corsair) broadcast into this stream. In demo mode a
 * "new email" lands ~18s after the page connects, so realtime can be
 * shown without waiting on Gmail.
 */
export async function GET() {
  const store = getStore();
  const encoder = new TextEncoder();

  let listener: ((e: { type: string; payload: unknown }) => void) | null = null;
  let heartbeat: ReturnType<typeof setInterval> | null = null;
  let demoTimer: ReturnType<typeof setTimeout> | null = null;

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
      store.listeners.add(listener);
      send("connected", { at: new Date().toISOString() });

      heartbeat = setInterval(() => send("ping", {}), 25_000);

      if (!store.liveEmailSent && !process.env.CORSAIR_KEK) {
        store.liveEmailSent = true;
        demoTimer = setTimeout(() => addEmail(buildLiveDemoEmail()), 18_000);
      }
    },
    cancel() {
      if (listener) getStore().listeners.delete(listener);
      if (heartbeat) clearInterval(heartbeat);
      if (demoTimer) clearTimeout(demoTimer);
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
