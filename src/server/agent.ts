import "server-only";
import * as chrono from "chrono-node";
import { AgentAction, AgentPlan } from "@/lib/types";
import { addMinutes } from "@/lib/time";

/**
 * Turns a natural-language command into a previewable action plan.
 *
 * Provider is chosen by which key is set: OPENAI_API_KEY → OpenAI,
 * else ANTHROPIC_API_KEY → Claude Haiku. With neither, a chrono-node +
 * heuristic parser covers the common commands so the palette still works.
 * Override the model per provider with OPENAI_MODEL / ANTHROPIC_MODEL.
 */
export async function planCommand(command: string): Promise<AgentPlan> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await planWithOpenAI(command);
    } catch (err) {
      console.error("agent: OpenAI planning failed, trying next provider", err);
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await planWithClaude(command);
    } catch (err) {
      // Log instead of swallowing — a misconfigured key or model access issue
      // would otherwise silently degrade to the weaker offline parser.
      console.error(
        "agent: Claude planning failed, falling back to offline parser",
        err,
      );
    }
  }
  return planOffline(command);
}

/** Shared system prompt — both providers must return the same JSON shape. */
function planSystemPrompt(): string {
  return `You convert email/calendar commands into JSON action plans. Current datetime: ${new Date().toString()}.
Respond ONLY with JSON: {"reply": string, "actions": [{"type": "create_event"|"send_email"|"search", "summary": string, "event"?: {"title": string, "start": ISO, "end": ISO, "attendees": [emails]}, "email"?: {"to": email, "subject": string, "body": string}, "query"?: string}]}`;
}

async function planWithOpenAI(command: string): Promise<AgentPlan> {
  const { default: OpenAI } = await import("openai");
  const client = new OpenAI();
  const res = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: planSystemPrompt() },
      { role: "user", content: command },
    ],
  });
  const text = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(text) as AgentPlan;
}

async function planWithClaude(command: string): Promise<AgentPlan> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: planSystemPrompt(),
    messages: [{ role: "user", content: command }],
  });
  const text = res.content.find((b) => b.type === "text")?.text ?? "{}";
  const json = JSON.parse(
    text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1),
  );
  return json as AgentPlan;
}

const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

export function planOffline(command: string): AgentPlan {
  const actions: AgentAction[] = [];
  // Split into clauses so compound commands ("...invite... and also send an
  // email too") produce one action each. Break on any run of connectors
  // (and / also / then / punctuation) that is followed by an action verb.
  const clauses = command.split(
    /(?:\s*(?:\band\b|\balso\b|\bthen\b|[.;!,])\s*)+(?=send|email|schedule|create|invite|book|find|search|add)/i,
  );

  let lastRecipient: string | null = null;
  let lastEventTitle: string | null = null;

  for (const clause of clauses) {
    const trimmed = clause.trim();
    if (!trimmed) continue;

    const emails = trimmed.match(EMAIL_RE) ?? [];
    if (emails.length) lastRecipient = emails[0] ?? null;
    const recipient = emails[0] ?? lastRecipient;

    const wantsEvent =
      /\b(calendar|invite|meeting|schedule|book|sync|call)\b/i.test(trimmed);
    const wantsEmail =
      /\b(email|mail|write|message)\b/i.test(trimmed) &&
      !/calendar invite/i.test(trimmed);
    const wantsSearch =
      /\b(find|search|show me|look for)\b/i.test(trimmed) && !wantsEvent;

    if (wantsSearch) {
      actions.push({
        type: "search",
        summary: `Search: "${trimmed}"`,
        query: trimmed,
      });
      continue;
    }

    // A clause can ask for both ("invite X 4–5pm and email him") — handle the
    // event first so the email subject can reference the meeting title.
    if (wantsEvent) {
      const parsed = chrono.parse(trimmed, new Date(), {
        forwardDate: true,
      })[0];
      const start = parsed?.start.date() ?? addMinutes(new Date(), 60);
      // Prefer an explicit range ("4 to 5 pm"); else an explicit duration
      // ("30 min" / "1 hour"); else default to 30 minutes.
      let end: Date;
      if (parsed?.end) {
        end = parsed.end.date();
      } else {
        const durationMatch = trimmed.match(/(\d+)\s*(min|minute|hour|hr)/i);
        const duration = durationMatch
          ? /h/i.test(durationMatch[2])
            ? parseInt(durationMatch[1]) * 60
            : parseInt(durationMatch[1])
          : 30;
        end = addMinutes(start, duration);
      }
      const who = recipient ? recipient.split("@")[0] : "guest";
      const title = `Meeting with ${who}`;
      lastEventTitle = title;
      actions.push({
        type: "create_event",
        summary: `Invite ${recipient ?? "—"} · ${start.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}–${end.toLocaleString([], { hour: "numeric", minute: "2-digit" })}`,
        event: {
          title,
          start: start.toISOString(),
          end: end.toISOString(),
          // Only the invitee — Google auto-adds the signed-in user as organizer.
          attendees: recipient ? [recipient] : [],
        },
      });
    }

    if (wantsEmail && recipient) {
      pushEmailAction(actions, trimmed, recipient, lastEventTitle);
    }
  }

  if (!actions.length) {
    return {
      reply:
        'I couldn\'t map that to an action. Try: "Send a calendar invite to saurabhprajapati120@gmail.com at 9 AM next Thursday"',
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
  lastEventTitle: string | null,
) {
  // "saying ..." / "that ..." captures the requested message body
  const saidMatch = clause.match(
    /\b(?:saying|that says|that|telling (?:him|her|them))\s+(.+)$/i,
  );
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

/** Generates a reply draft for an email. Uses OpenAI/Claude when a key is set. */
export async function draftReply(
  subject: string,
  body: string,
  senderName: string,
): Promise<string> {
  const draftSystem =
    "Draft a short, warm, professional email reply (2-4 sentences). Output only the reply body, no subject line.";
  const draftUser = `From: ${senderName}\nSubject: ${subject}\n\n${body}`;

  if (process.env.OPENAI_API_KEY) {
    try {
      const { default: OpenAI } = await import("openai");
      const client = new OpenAI();
      const res = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
        max_tokens: 300,
        messages: [
          { role: "system", content: draftSystem },
          { role: "user", content: draftUser },
        ],
      });
      const text = res.choices[0]?.message?.content;
      if (text) return text.trim();
    } catch (err) {
      console.error("agent: OpenAI draft failed, trying next provider", err);
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic();
      const res = await client.messages.create({
        model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: draftSystem,
        messages: [{ role: "user", content: draftUser }],
      });
      const text = res.content.find((b) => b.type === "text")?.text;
      if (text) return text.trim();
    } catch (err) {
      console.error("agent: Claude draft failed, using template", err);
    }
  }
  const first = senderName.split(" ")[0];
  if (
    /\b(\d{1,2}\s?(am|pm)|tomorrow|monday|tuesday|wednesday|thursday|friday)\b/i.test(
      body,
    )
  ) {
    return `Hi ${first},\n\nThat time works for me — I've added it to my calendar. Looking forward to it!\n\nBest`;
  }
  return `Hi ${first},\n\nThanks for this — noted. I'll get back to you with details shortly.\n\nBest`;
}
