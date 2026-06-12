import "server-only";
import { Priority } from "@/lib/types";

/**
 * Priority classification for incoming email (bonus task: "send the email
 * subject + body through a very cheap LLM"). Uses Claude Haiku when a key
 * is present; otherwise a transparent heuristic so demo mode still works.
 */
export async function classifyPriority(
  subject: string,
  body: string
): Promise<{ priority: Priority; priorityReason: string }> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 100,
        system:
          'Classify email priority. Respond ONLY with JSON: {"priority": "urgent"|"normal"|"low", "reason": "<short>"}. urgent = real person needs action/has deadline; normal = human or actionable automated; low = newsletters/digests/notifications.',
        messages: [{ role: "user", content: `Subject: ${subject}\n\n${body.slice(0, 1500)}` }],
      });
      const text = res.content.find((b) => b.type === "text")?.text ?? "";
      const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
      return { priority: json.priority, priorityReason: json.reason };
    } catch {
      // fall through to heuristic
    }
  }

  const text = `${subject} ${body}`.toLowerCase();
  if (/(urgent|asap|deadline|failed|outage|due|confirm|tomorrow|today)/.test(text)) {
    return { priority: "urgent", priorityReason: "Deadline or failure language detected" };
  }
  if (/(newsletter|digest|unsubscribe|no-reply|noreply|notifications@)/.test(text)) {
    return { priority: "low", priorityReason: "Automated / bulk sender" };
  }
  return { priority: "normal", priorityReason: "Default" };
}
