import { Email, CalendarEvent } from "./types";
import { addDays, addMinutes, startOfDay } from "./time";

/**
 * Demo dataset anchored to "now" so the timeline always looks live.
 * Emails cover all three priority lanes and several carry time-intent
 * so the schedule-from-email flow can be shown.
 */
export function buildMockData(): { emails: Email[]; events: CalendarEvent[] } {
  const now = new Date();
  const today9 = new Date(startOfDay(now));
  today9.setHours(9, 0);

  const at = (dayOffset: number, h: number, m = 0) => {
    const d = addDays(startOfDay(now), dayOffset);
    d.setHours(h, m);
    return d;
  };
  const iso = (d: Date) => d.toISOString();
  const ago = (mins: number) => iso(addMinutes(now, -mins));

  const emails: Email[] = [
    {
      id: "e1",
      threadId: "t1",
      from: { name: "Dev Jain", email: "dev@corsair.dev" },
      to: ["me@tempo.app"],
      subject: "Quick sync on your hackathon integration?",
      snippet: "Loved the direction. Can we sync tomorrow at 2pm to walk through the MCP setup?",
      body: "Hey!\n\nLoved the direction you're taking with the unified timeline. Can we sync tomorrow at 2pm to walk through the MCP setup? I can show you the webhook config too.\n\nDev",
      receivedAt: ago(12),
      unread: true,
      archived: false,
      priority: "urgent",
      priorityReason: "Direct ask from a person + proposes a meeting",
      timeIntent: {
        start: iso(at(1, 14, 0)),
        duration: 30,
        phrase: "tomorrow at 2pm",
        kind: "meeting",
      },
      labels: ["inbox"],
    },
    {
      id: "e2",
      threadId: "t2",
      from: { name: "Hitesh Choudhary", email: "hitesh@chaicode.com" },
      to: ["me@tempo.app"],
      subject: "Demo slot confirmed — be ready Friday 11am",
      snippet: "Your demo slot is confirmed for Friday 11am sharp. 5 minutes, make them count.",
      body: "Your demo slot is confirmed for Friday 11am sharp.\n\n5 minutes, make them count. Judges love seeing real keystrokes, not slides.\n\n— Hitesh",
      receivedAt: ago(45),
      unread: true,
      archived: false,
      priority: "urgent",
      priorityReason: "Deadline with a fixed time",
      timeIntent: {
        start: iso(at(2, 11, 0)),
        duration: 30,
        phrase: "Friday 11am",
        kind: "deadline",
      },
      labels: ["inbox"],
    },
    {
      id: "e3",
      threadId: "t3",
      from: { name: "Piyush Garg", email: "piyush@teachyst.com" },
      to: ["me@tempo.app"],
      subject: "Re: Corsair webhook question",
      snippet: "Yes — use the built-in webhook matcher, it verifies the Pub/Sub signature for you.",
      body: "Yes — use the built-in webhook matcher, it verifies the Pub/Sub signature for you. Don't poll the Gmail API, you'll burn quota.\n\nPiyush",
      receivedAt: ago(95),
      unread: true,
      archived: false,
      priority: "normal",
      priorityReason: "Reply in an ongoing thread, no action deadline",
      labels: ["inbox"],
    },
    {
      id: "e4",
      threadId: "t4",
      from: { name: "Stripe", email: "receipts@stripe.com" },
      to: ["me@tempo.app"],
      subject: "Your invoice #1042 is due next Monday",
      snippet: "Invoice #1042 for $49.00 is due next Monday. Pay now to avoid service interruption.",
      body: "Invoice #1042 for $49.00 is due next Monday.\n\nPay now to avoid service interruption.",
      receivedAt: ago(180),
      unread: false,
      archived: false,
      priority: "normal",
      priorityReason: "Automated but has a real deadline",
      timeIntent: {
        start: iso(at(((8 - now.getDay()) % 7) + 7 === 7 ? 7 : ((8 - now.getDay()) % 7) || 7, 10, 0)),
        duration: 15,
        phrase: "due next Monday",
        kind: "deadline",
      },
      labels: ["inbox"],
    },
    {
      id: "e5",
      threadId: "t5",
      from: { name: "Anjali Mehta", email: "anjali@designstudio.in" },
      to: ["me@tempo.app"],
      subject: "Logo concepts for Tempo",
      snippet: "Attached three directions for the Tempo mark. The metronome one is my favourite.",
      body: "Attached three directions for the Tempo mark. The metronome one is my favourite — it captures the 'email in rhythm' idea.\n\nLet me know which direction to refine.\n\nAnjali",
      receivedAt: ago(260),
      unread: true,
      archived: false,
      priority: "normal",
      priorityReason: "Human sender, awaiting your decision",
      labels: ["inbox"],
    },
    {
      id: "e6",
      threadId: "t6",
      from: { name: "GitHub", email: "notifications@github.com" },
      to: ["me@tempo.app"],
      subject: "[corsairdev/corsair] v0.2.0 released",
      snippet: "Release notes: new search API, faster webhook fan-out, Gmail batch operations.",
      body: "Release notes:\n- new search API\n- faster webhook fan-out\n- Gmail batch operations",
      receivedAt: ago(420),
      unread: false,
      archived: false,
      priority: "low",
      priorityReason: "Automated notification, no action needed",
      labels: ["inbox"],
    },
    {
      id: "e7",
      threadId: "t7",
      from: { name: "Lenny's Newsletter", email: "lenny@substack.com" },
      to: ["me@tempo.app"],
      subject: "How Superhuman got its first 1,000 users",
      snippet: "This week: the manual onboarding playbook that built a cult product.",
      body: "This week: the manual onboarding playbook that built a cult product...",
      receivedAt: ago(600),
      unread: false,
      archived: false,
      priority: "low",
      priorityReason: "Newsletter",
      labels: ["inbox"],
    },
    {
      id: "e8",
      threadId: "t8",
      from: { name: "Rahul Verma", email: "rahul@vc-partners.com" },
      to: ["me@tempo.app"],
      subject: "Intro call — would Thursday 4pm work?",
      snippet: "Saw your hackathon post on LinkedIn. Would Thursday 4pm work for a quick intro call?",
      body: "Saw your hackathon post on LinkedIn — the unified email+calendar timeline is a sharp idea.\n\nWould Thursday 4pm work for a quick intro call?\n\nRahul",
      receivedAt: ago(30),
      unread: true,
      archived: false,
      priority: "urgent",
      priorityReason: "Inbound opportunity proposing a specific time",
      timeIntent: {
        start: iso(at(((4 - now.getDay() + 7) % 7) || 7, 16, 0)),
        duration: 30,
        phrase: "Thursday 4pm",
        kind: "meeting",
      },
      labels: ["inbox"],
    },
    {
      id: "e9",
      threadId: "t9",
      from: { name: "Vercel", email: "no-reply@vercel.com" },
      to: ["me@tempo.app"],
      subject: "Deployment failed: tempo-app (production)",
      snippet: "Build failed in 34s. Error: missing environment variable CORSAIR_KEK.",
      body: "Build failed in 34s.\n\nError: missing environment variable CORSAIR_KEK.",
      receivedAt: ago(8),
      unread: true,
      archived: false,
      priority: "urgent",
      priorityReason: "Production failure",
      labels: ["inbox"],
    },
    {
      id: "e10",
      threadId: "t10",
      from: { name: "Product Hunt", email: "digest@producthunt.com" },
      to: ["me@tempo.app"],
      subject: "Today's top launches",
      snippet: "An AI that names your pets, and 9 other launches you missed.",
      body: "An AI that names your pets, and 9 other launches you missed.",
      receivedAt: ago(700),
      unread: false,
      archived: false,
      priority: "low",
      priorityReason: "Digest",
      labels: ["inbox"],
    },
  ];

  const events: CalendarEvent[] = [
    {
      id: "ev1",
      title: "Standup — hackathon squad",
      start: iso(at(0, 10, 0)),
      end: iso(at(0, 10, 30)),
      attendees: ["me@tempo.app", "team@tempo.app"],
      color: "indigo",
    },
    {
      id: "ev2",
      title: "Deep work: agent palette",
      start: iso(at(0, 14, 0)),
      end: iso(at(0, 16, 0)),
      attendees: ["me@tempo.app"],
      color: "slate",
    },
    {
      id: "ev3",
      title: "Corsair office hours",
      start: iso(at(1, 11, 0)),
      end: iso(at(1, 11, 45)),
      attendees: ["me@tempo.app", "dev@corsair.dev"],
      location: "Discord",
      color: "violet",
    },
    {
      id: "ev4",
      title: "Gym",
      start: iso(at(2, 7, 0)),
      end: iso(at(2, 8, 0)),
      attendees: ["me@tempo.app"],
      color: "emerald",
    },
  ];

  return { emails, events };
}

/** The email that "arrives" live over the realtime stream during a demo. */
export function buildLiveDemoEmail(): Email {
  const now = new Date();
  const tomorrow11 = addDays(startOfDay(now), 1);
  tomorrow11.setHours(11, 0);
  return {
    id: `live-${Date.now()}`,
    threadId: `t-live-${Date.now()}`,
    from: { name: "Corsair Team", email: "team@corsair.dev" },
    to: ["me@tempo.app"],
    subject: "Mentor check-in tomorrow at 11am?",
    snippet: "We're doing quick mentor check-ins. Does tomorrow at 11am work for you?",
    body: "Hey builder!\n\nWe're doing quick mentor check-ins with every hackathon team. Does tomorrow at 11am work for you? We'll review your Corsair wiring and demo plan.\n\n— Corsair Team",
    receivedAt: now.toISOString(),
    unread: true,
    archived: false,
    priority: "urgent",
    priorityReason: "Direct ask proposing a meeting time",
    timeIntent: {
      start: tomorrow11.toISOString(),
      duration: 30,
      phrase: "tomorrow at 11am",
      kind: "meeting",
    },
    labels: ["inbox"],
  };
}
