import "server-only";
import * as chrono from "chrono-node";
import { AgentAction, AgentPlan } from "@/lib/types";
import { addMinutes } from "@/lib/time";

/**
 * Turns a natural-language command into a previewable action plan.
 *
 * With ANTHROPIC_API_KEY set, Claude Haiku does the parsing (and in live
 * mode the Corsair MCP executes). Without it, a chrono-node + heuristic
 * parser covers the demo commands so the palette works offline.
 */
export async function planCommand(command: string): Promise<AgentPlan> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await planWithClaude(command);
    } catch {
      // fall through to the offline parser rather than failing the palette
    }
  }
  return planOffline(command);
}

async function planWithClaude(command: string): Promise<AgentPlan> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const res = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `You convert email/calendar commands into JSON action plans. Current datetime: ${new Date().toString()}.
Respond ONLY with JSON: {"reply": string, "actions": [{"type": "create_event"|"send_email"|"search", "summary": string, "event"?: {"title": string, "start": ISO, "end": ISO, "attendees": [emails]}, "email"?: {"to": email, "subject": string, "body": string}, "query"?: string}]}`,
    messages: [{ role: "user", content: command }],
  });
  const text = res.content.find((b) => b.type === "text")?.text ?? "{}";
  const json = JSON.parse(text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1));
  return json as AgentPlan;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function planOffline(command: string): AgentPlan {
  const actions: AgentAction[] = [];
  // Split into clauses so compound commands ("...invite... Send him an email too...")
  // produce one action each.
  const clauses = command.split(/(?<=[.!;])\s+|\s+and\s+(?=send|email|schedule|create|invite)/i);

  let lastRecipient: string | null = null;
  let lastEventTitle: string | null = null;

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (!trimmed) continue;

    const emails = trimmed.match(EMAIL_RE) ?? [];
    if (emails.length) lastRecipient = emails[0] ?? null;
    const recipient = emails[0] ?? lastRecipient;

    const wantsEvent = /\b(calendar|invite|meeting|schedule|book|sync|call)\b/i.test(trimmed);
    const wantsEmail = /\b(email|mail|write|message)\b/i.test(trimmed) && !/calendar invite/i.test(trimmed);
    const wantsSearch = /\b(find|search|show me|look for)\b/i.test(trimmed) && !wantsEvent;

    if (wantsSearch) {
      actions.push({ type: "search", summary: `Search: "${trimmed}"`, query: trimmed });
      continue;
    }

    // An explicit "email" wins even if the clause also mentions a meeting
    // ("send him an email saying I look forward to our meeting").
    if (wantsEmail && recipient) {
      pushEmailAction(actions, trimmed, recipient, lastEventTitle);
      continue;
    }

    if (wantsEvent) {
      const parsed = chrono.parse(trimmed, new Date(), { forwardDate: true });
      const start = parsed[0]?.start.date() ?? addMinutes(new Date(), 60);
      const durationMatch = trimmed.match(/(\d+)\s*(min|minute|hour|hr)/i);
      const duration = durationMatch
        ? /h/i.test(durationMatch[2])
          ? parseInt(durationMatch[1]) * 60
          : parseInt(durationMatch[1])
        : 30;
      const who = recipient ? recipient.split("@")[0] : "guest";
      const title = `Meeting with ${who}`;
      lastEventTitle = title;
      actions.push({
        type: "create_event",
        summary: `Invite ${recipient ?? "—"} · ${start.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · ${duration} min`,
        event: {
          title,
          start: start.toISOString(),
          end: addMinutes(start, duration).toISOString(),
          attendees: recipient ? ["me@tempo.app", recipient] : ["me@tempo.app"],
        },
      });
      continue;
    }
  }

  if (!actions.length) {
    return {
      reply: "I couldn't map that to an action. Try: \"Send a calendar invite to dev@corsair.dev at 9 AM next Thursday\"",
      actions: [{ type: "unknown", summary: "No action recognized" }],
    };
  }

  return {
    reply: `Planned ${actions.length} action${actions.length > 1 ? "s" : ""} — review and press Enter to execute.`,
    actions,
  };
}

function pushEmailAction(
  actions: AgentAction[],
  clause: string,
  recipient: string,
  lastEventTitle: string | null
) {
  // "saying ..." / "that ..." captures the requested message body
  const saidMatch = clause.match(/\b(?:saying|that says|that|telling (?:him|her|them))\s+(.+)$/i);
  const said = saidMatch ? saidMatch[1].replace(/^i\b/, "I") : null;
  const body = said
    ? `Hi,\n\n${said.charAt(0).toUpperCase() + said.slice(1)}\n\nBest,\nSent from Tempo`
    : `Hi,\n\nFollowing up from Tempo.\n\nBest`;
  actions.push({
    type: "send_email",
    summary: `Email ${recipient} — "${said ?? "follow-up"}"`,
    email: {
      to: recipient,
      subject: lastEventTitle ? `Re: ${lastEventTitle}` : "Hello from Tempo",
      body,
    },
  });
}

/** Generates a reply draft for an email. Uses Claude when a key is present. */
export async function draftReply(subject: string, body: string, senderName: string): Promise<string> {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();
      const res = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system:
          "Draft a short, warm, professional email reply (2-4 sentences). Output only the reply body, no subject line.",
        messages: [{ role: "user", content: `From: ${senderName}\nSubject: ${subject}\n\n${body}` }],
      });
      const text = res.content.find((b) => b.type === "text")?.text;
      if (text) return text.trim();
    } catch {
      // fall through to template
    }
  }
  const first = senderName.split(" ")[0];
  if (/\b(\d{1,2}\s?(am|pm)|tomorrow|monday|tuesday|wednesday|thursday|friday)\b/i.test(body)) {
    return `Hi ${first},\n\nThat time works for me — I've added it to my calendar. Looking forward to it!\n\nBest`;
  }
  return `Hi ${first},\n\nThanks for this — noted. I'll get back to you with details shortly.\n\nBest`;
}
