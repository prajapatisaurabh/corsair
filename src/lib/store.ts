"use client";

import { create } from "zustand";
import { Email, CalendarEvent, AgentPlan, Priority } from "./types";

export type ViewMode = "timeline" | "triage";

interface Toast {
  id: number;
  text: string;
  kind: "success" | "info" | "error";
}

interface TempoState {
  emails: Email[];
  events: CalendarEvent[];
  live: boolean;
  selectedId: string | null;
  detailOpen: boolean;
  replyDraft: string | null;
  draftLoading: boolean;
  filter: Priority | "all";
  view: ViewMode;
  paletteOpen: boolean;
  triageStreak: number;
  toasts: Toast[];

  load: () => Promise<void>;
  connectStream: () => void;
  select: (id: string | null) => void;
  moveSelection: (dir: 1 | -1) => void;
  openDetail: (withDraft?: boolean) => Promise<void>;
  closeOverlays: () => void;
  archive: (id: string) => Promise<void>;
  snooze: (id: string) => Promise<void>;
  schedule: (id: string) => Promise<void>;
  sendReply: (email: Email, body: string) => Promise<void>;
  setFilter: (f: Priority | "all") => void;
  setView: (v: ViewMode) => void;
  setPaletteOpen: (open: boolean) => void;
  runPlan: (plan: AgentPlan) => Promise<void>;
  toast: (text: string, kind?: Toast["kind"]) => void;
  bumpStreak: () => void;
}

/** Inbox = not archived, not snoozed-into-the-future. */
export function visibleEmails(emails: Email[], filter: Priority | "all"): Email[] {
  const now = Date.now();
  return emails
    .filter(
      (e) =>
        !e.archived &&
        (!e.snoozedUntil || new Date(e.snoozedUntil).getTime() <= now) &&
        (filter === "all" || e.priority === filter)
    )
    .sort((a, b) => {
      const rank = { urgent: 0, normal: 1, low: 2 };
      if (rank[a.priority] !== rank[b.priority]) return rank[a.priority] - rank[b.priority];
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime();
    });
}

let toastId = 0;

export const useTempo = create<TempoState>((set, get) => ({
  emails: [],
  events: [],
  live: false,
  selectedId: null,
  detailOpen: false,
  replyDraft: null,
  draftLoading: false,
  filter: "all",
  view: "timeline",
  paletteOpen: false,
  triageStreak: 0,
  toasts: [],

  load: async () => {
    const [er, vr] = await Promise.all([fetch("/api/emails"), fetch("/api/events")]);
    const { emails, live } = await er.json();
    const { events } = await vr.json();
    set((s) => ({
      emails,
      events,
      live,
      selectedId: s.selectedId ?? visibleEmails(emails, s.filter)[0]?.id ?? null,
    }));
  },

  connectStream: () => {
    const es = new EventSource("/api/stream");
    es.onmessage = (msg) => {
      const { type, payload } = JSON.parse(msg.data);
      if (type === "email.new") {
        set((s) => ({ emails: [payload, ...s.emails.filter((e) => e.id !== payload.id)] }));
        get().toast(`New email — ${payload.from.name}: ${payload.subject}`, "info");
      } else if (type === "email.updated") {
        set((s) => ({ emails: s.emails.map((e) => (e.id === payload.id ? payload : e)) }));
      } else if (type === "event.new") {
        set((s) =>
          s.events.some((ev) => ev.id === payload.id) ? s : { events: [...s.events, payload] }
        );
      }
    };
  },

  select: (id) => set({ selectedId: id }),

  moveSelection: (dir) => {
    const { emails, filter, selectedId } = get();
    const list = visibleEmails(emails, filter);
    if (!list.length) return;
    const idx = list.findIndex((e) => e.id === selectedId);
    const next = list[Math.min(list.length - 1, Math.max(0, idx + dir))] ?? list[0];
    set({ selectedId: next.id });
  },

  openDetail: async (withDraft = false) => {
    const { selectedId, emails } = get();
    const email = emails.find((e) => e.id === selectedId);
    if (!email) return;
    set({ detailOpen: true, replyDraft: withDraft ? null : get().replyDraft, draftLoading: withDraft });
    if (email.unread) {
      fetch("/api/emails", {
        method: "PATCH",
        body: JSON.stringify({ id: email.id, unread: false }),
      });
      set((s) => ({
        emails: s.emails.map((e) => (e.id === email.id ? { ...e, unread: false } : e)),
      }));
    }
    if (withDraft) {
      const res = await fetch("/api/draft", {
        method: "POST",
        body: JSON.stringify({
          subject: email.subject,
          body: email.body,
          senderName: email.from.name,
        }),
      });
      const { draft } = await res.json();
      set({ replyDraft: draft, draftLoading: false });
    }
  },

  closeOverlays: () =>
    set({ detailOpen: false, paletteOpen: false, replyDraft: null, view: "timeline" }),

  archive: async (id) => {
    set((s) => ({ emails: s.emails.map((e) => (e.id === id ? { ...e, archived: true } : e)) }));
    get().moveSelection(1);
    get().toast("Archived", "success");
    await fetch("/api/emails", { method: "PATCH", body: JSON.stringify({ id, archived: true }) });
  },

  snooze: async (id) => {
    const until = new Date(Date.now() + 3 * 3600_000).toISOString();
    set((s) => ({
      emails: s.emails.map((e) => (e.id === id ? { ...e, snoozedUntil: until } : e)),
    }));
    get().moveSelection(1);
    get().toast("Snoozed 3 hours", "info");
    await fetch("/api/emails", { method: "PATCH", body: JSON.stringify({ id, snoozedUntil: until }) });
  },

  schedule: async (id) => {
    const email = get().emails.find((e) => e.id === id);
    if (!email?.timeIntent) {
      get().toast("No time detected in this email", "error");
      return;
    }
    const { start, duration } = email.timeIntent;
    const end = new Date(new Date(start).getTime() + duration * 60_000).toISOString();
    const res = await fetch("/api/events", {
      method: "POST",
      body: JSON.stringify({
        title: email.timeIntent.kind === "meeting" ? `${email.from.name} — ${email.subject}` : `⏰ ${email.subject}`,
        start,
        end,
        attendees: ["me@tempo.app", email.from.email],
        sourceEmailId: email.id,
      }),
    });
    const { event } = await res.json();
    set((s) => ({
      events: s.events.some((ev) => ev.id === event.id) ? s.events : [...s.events, event],
      emails: s.emails.map((e) =>
        e.id === id ? { ...e, scheduledEventId: event.id, archived: true } : e
      ),
    }));
    get().toast(`Scheduled: ${email.timeIntent.phrase} → invite sent to ${email.from.email}`, "success");
  },

  sendReply: async (email, body) => {
    set({ detailOpen: false, replyDraft: null });
    await fetch("/api/emails", {
      method: "POST",
      body: JSON.stringify({ to: email.from.email, subject: `Re: ${email.subject}`, body }),
    });
    get().archive(email.id);
    get().toast(`Reply sent to ${email.from.email}`, "success");
  },

  setFilter: (f) => set({ filter: f }),
  setView: (v) => set({ view: v }),
  setPaletteOpen: (open) => set({ paletteOpen: open }),

  runPlan: async (plan) => {
    for (const action of plan.actions) {
      if (action.type === "create_event" && action.event) {
        const res = await fetch("/api/events", { method: "POST", body: JSON.stringify(action.event) });
        const { event } = await res.json();
        set((s) => ({
          events: s.events.some((ev) => ev.id === event.id) ? s.events : [...s.events, event],
        }));
        get().toast(`Invite sent: ${event.title}`, "success");
      } else if (action.type === "send_email" && action.email) {
        await fetch("/api/emails", { method: "POST", body: JSON.stringify(action.email) });
        get().toast(`Email sent to ${action.email.to}`, "success");
      }
    }
    set({ paletteOpen: false });
  },

  toast: (text, kind = "info") => {
    const id = ++toastId;
    set((s) => ({ toasts: [...s.toasts, { id, text, kind }] }));
    setTimeout(
      () => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
      4000
    );
  },

  bumpStreak: () => set((s) => ({ triageStreak: s.triageStreak + 1 })),
}));
