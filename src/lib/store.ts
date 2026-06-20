"use client";

import { create } from "zustand";
import { Email, CalendarEvent, AgentPlan, Priority } from "./types";
import { fmtTime } from "./time";
import { readApiError } from "./api";

export type ViewMode = "timeline" | "triage";

interface Toast {
  id: number;
  text: string;
  kind: "success" | "info" | "error";
}

/** A reversible action — lets U undo the last archive/snooze. */
interface UndoEntry {
  emailId: string;
  patch: Partial<Email>;
  label: string;
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
  search: string;
  view: ViewMode;
  calendarExpanded: boolean;
  paletteOpen: boolean;
  triageStreak: number;
  toasts: Toast[];
  lastUndo: UndoEntry | null;

  load: () => Promise<void>;
  connectStream: () => void;
  select: (id: string | null) => void;
  moveSelection: (dir: 1 | -1) => void;
  openDetail: (withDraft?: boolean) => Promise<void>;
  closeOverlays: () => void;
  archive: (id: string) => Promise<void>;
  snooze: (id: string) => Promise<void>;
  schedule: (id: string) => Promise<void>;
  undo: () => Promise<void>;
  sendReply: (email: Email, body: string) => Promise<void>;
  saveDraft: (email: Email, body: string) => Promise<void>;
  setFilter: (f: Priority | "all") => void;
  setSearch: (q: string) => void;
  setView: (v: ViewMode) => void;
  toggleCalendar: () => void;
  setPaletteOpen: (open: boolean) => void;
  runPlan: (plan: AgentPlan) => Promise<void>;
  toast: (text: string, kind?: Toast["kind"]) => void;
  bumpStreak: () => void;
}

/** Inbox = not archived, not snoozed-into-the-future. Optional free-text search. */
export function visibleEmails(
  emails: Email[],
  filter: Priority | "all",
  search = "",
): Email[] {
  const now = Date.now();
  const q = search.trim().toLowerCase();
  const matches = (e: Email) =>
    !q ||
    `${e.from.name} ${e.from.email} ${e.subject} ${e.snippet} ${e.body}`
      .toLowerCase()
      .includes(q);
  return emails
    .filter(
      (e) =>
        !e.archived &&
        (!e.snoozedUntil || new Date(e.snoozedUntil).getTime() <= now) &&
        (filter === "all" || e.priority === filter) &&
        matches(e),
    )
    .sort((a, b) => {
      const rank = { urgent: 0, normal: 1, low: 2 };
      if (rank[a.priority] !== rank[b.priority])
        return rank[a.priority] - rank[b.priority];
      return (
        new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
      );
    });
}

let toastId = 0;
let stream: EventSource | null = null;

export const useTempo = create<TempoState>((set, get) => ({
  emails: [],
  events: [],
  live: false,
  selectedId: null,
  detailOpen: false,
  replyDraft: null,
  draftLoading: false,
  filter: "all",
  search: "",
  view: "timeline",
  calendarExpanded: false,
  paletteOpen: false,
  triageStreak: 0,
  toasts: [],
  lastUndo: null,

  load: async () => {
    try {
      const [er, vr] = await Promise.all([
        fetch("/api/emails"),
        fetch("/api/events"),
      ]);
      if (!er.ok)
        throw new Error(await readApiError(er, "Couldn't load inbox"));
      if (!vr.ok)
        throw new Error(await readApiError(vr, "Couldn't load calendar"));
      const { emails, live } = await er.json();
      const { events } = await vr.json();
      set((s) => ({
        emails,
        events,
        live,
        selectedId:
          s.selectedId ?? visibleEmails(emails, s.filter)[0]?.id ?? null,
      }));
    } catch (err) {
      get().toast(
        err instanceof Error ? err.message : "Couldn't load your data",
        "error",
      );
    }
  },

  connectStream: () => {
    // Guard against duplicate connections (React strict-mode double-invoke / re-renders).
    if (stream && stream.readyState !== EventSource.CLOSED) return;
    const es = new EventSource("/api/stream");
    stream = es;
    es.onmessage = (msg) => {
      const { type, payload } = JSON.parse(msg.data);
      if (type === "email.new") {
        set((s) => ({
          emails: [payload, ...s.emails.filter((e) => e.id !== payload.id)],
        }));
        get().toast(
          `New email — ${payload.from.name}: ${payload.subject}`,
          "info",
        );
      } else if (type === "email.updated") {
        set((s) => ({
          emails: s.emails.map((e) => (e.id === payload.id ? payload : e)),
        }));
      } else if (type === "event.new") {
        set((s) =>
          s.events.some((ev) => ev.id === payload.id)
            ? s
            : { events: [...s.events, payload] },
        );
      }
    };
    // Browsers auto-retry on transient drops, but if the stream errors hard we
    // close it and reconnect after a short backoff so realtime never dies silently.
    es.onerror = () => {
      es.close();
      if (stream === es) stream = null;
      setTimeout(() => get().connectStream(), 3000);
    };
  },

  select: (id) => set({ selectedId: id }),

  moveSelection: (dir) => {
    const { emails, filter, selectedId } = get();
    const list = visibleEmails(emails, filter);
    if (!list.length) return;
    const idx = list.findIndex((e) => e.id === selectedId);
    const next =
      list[Math.min(list.length - 1, Math.max(0, idx + dir))] ?? list[0];
    set({ selectedId: next.id });
  },

  openDetail: async (withDraft = false) => {
    const { selectedId, emails } = get();
    const email = emails.find((e) => e.id === selectedId);
    if (!email) return;
    set({
      detailOpen: true,
      replyDraft: withDraft ? null : get().replyDraft,
      draftLoading: withDraft,
    });
    if (email.unread) {
      fetch("/api/emails", {
        method: "PATCH",
        body: JSON.stringify({ id: email.id, unread: false }),
      });
      set((s) => ({
        emails: s.emails.map((e) =>
          e.id === email.id ? { ...e, unread: false } : e,
        ),
      }));
    }
    if (withDraft) {
      try {
        const res = await fetch("/api/draft", {
          method: "POST",
          body: JSON.stringify({
            subject: email.subject,
            body: email.body,
            senderName: email.from.name,
          }),
        });
        if (!res.ok) throw new Error(await readApiError(res, "Draft failed"));
        const { draft } = await res.json();
        set({ replyDraft: draft, draftLoading: false });
      } catch (err) {
        // Don't strand the user on the "drafting…" spinner — clear it, drop
        // out of reply mode, and surface why.
        set({ draftLoading: false, replyDraft: null });
        get().toast(
          err instanceof Error ? err.message : "Couldn't draft a reply",
          "error",
        );
      }
    }
  },

  closeOverlays: () =>
    set({
      detailOpen: false,
      paletteOpen: false,
      replyDraft: null,
      view: "timeline",
    }),

  archive: async (id) => {
    const prev = get().emails.find((e) => e.id === id);
    if (!prev) return;
    // Optimistic: hide it immediately, confirm the write, then toast — or roll
    // back if the server rejects it.
    set((s) => ({
      emails: s.emails.map((e) => (e.id === id ? { ...e, archived: true } : e)),
      lastUndo: { emailId: id, patch: { archived: false }, label: "Archived" },
    }));
    get().moveSelection(1);
    const res = await fetch("/api/emails", {
      method: "PATCH",
      body: JSON.stringify({ id, archived: true }),
    });
    if (res.ok) {
      get().toast("Archived · press U to undo", "success");
    } else {
      set((s) => ({
        emails: s.emails.map((e) =>
          e.id === id ? { ...e, archived: prev.archived } : e,
        ),
        lastUndo: null,
      }));
      get().toast(await readApiError(res, "Couldn't archive"), "error");
    }
  },

  snooze: async (id) => {
    const prev = get().emails.find((e) => e.id === id)?.snoozedUntil ?? null;
    const until = new Date(Date.now() + 3 * 3600_000).toISOString();
    set((s) => ({
      emails: s.emails.map((e) =>
        e.id === id ? { ...e, snoozedUntil: until } : e,
      ),
      lastUndo: {
        emailId: id,
        patch: { snoozedUntil: prev ?? undefined },
        label: "Snoozed",
      },
    }));
    get().moveSelection(1);
    const res = await fetch("/api/emails", {
      method: "PATCH",
      body: JSON.stringify({ id, snoozedUntil: until }),
    });
    if (res.ok) {
      get().toast("Snoozed 3 hours · press U to undo", "info");
    } else {
      set((s) => ({
        emails: s.emails.map((e) =>
          e.id === id ? { ...e, snoozedUntil: prev ?? undefined } : e,
        ),
        lastUndo: null,
      }));
      get().toast(await readApiError(res, "Couldn't snooze"), "error");
    }
  },

  undo: async () => {
    const entry = get().lastUndo;
    if (!entry) {
      get().toast("Nothing to undo", "info");
      return;
    }
    const prev = get().emails.find((e) => e.id === entry.emailId);
    set((s) => ({
      emails: s.emails.map((e) =>
        e.id === entry.emailId ? { ...e, ...entry.patch } : e,
      ),
      selectedId: entry.emailId,
      lastUndo: null,
    }));
    const res = await fetch("/api/emails", {
      method: "PATCH",
      body: JSON.stringify({ id: entry.emailId, ...entry.patch }),
    });
    if (res.ok) {
      get().toast(`Undid: ${entry.label.toLowerCase()}`, "info");
    } else {
      // Re-apply the pre-undo state and keep the undo entry so it can retry.
      if (prev) {
        set((s) => ({
          emails: s.emails.map((e) => (e.id === entry.emailId ? prev : e)),
          lastUndo: entry,
        }));
      }
      get().toast(await readApiError(res, "Couldn't undo"), "error");
    }
  },

  schedule: async (id) => {
    const email = get().emails.find((e) => e.id === id);
    if (!email?.timeIntent) {
      get().toast("No time detected in this email", "error");
      return;
    }
    const { start, duration } = email.timeIntent;
    const end = new Date(
      new Date(start).getTime() + duration * 60_000,
    ).toISOString();
    const res = await fetch("/api/events", {
      method: "POST",
      body: JSON.stringify({
        title:
          email.timeIntent.kind === "meeting"
            ? `${email.from.name} — ${email.subject}`
            : `⏰ ${email.subject}`,
        start,
        end,
        // Only the other party — Google auto-adds the signed-in user as organizer.
        attendees: [email.from.email],
        sourceEmailId: email.id,
      }),
    });
    if (!res.ok) {
      get().toast(await readApiError(res, "Couldn't schedule"), "error");
      return;
    }
    const { event, shiftedFrom } = await res.json();
    set((s) => ({
      events: s.events.some((ev) => ev.id === event.id)
        ? s.events
        : [...s.events, event],
      emails: s.emails.map((e) =>
        e.id === id ? { ...e, scheduledEventId: event.id, archived: true } : e,
      ),
    }));
    if (shiftedFrom) {
      // The requested slot was busy — Tempo slid it to the next free one.
      get().toast(
        `${fmtTime(shiftedFrom)} was busy → booked ${fmtTime(event.start)} (next free) · invite sent`,
        "success",
      );
    } else {
      get().toast(
        `Scheduled: ${email.timeIntent.phrase} → invite sent to ${email.from.email}`,
        "success",
      );
    }
  },

  sendReply: async (email, body) => {
    set({ detailOpen: false, replyDraft: null });
    const res = await fetch("/api/emails", {
      method: "POST",
      body: JSON.stringify({
        to: email.from.email,
        // "Re:" once — keep the conversation's subject if it already has it.
        subject: /^re:/i.test(email.subject)
          ? email.subject
          : `Re: ${email.subject}`,
        body,
        // Thread the reply into the original Gmail conversation.
        threadId: email.threadId,
        inReplyTo: email.id,
      }),
    });
    // Only archive + claim success once the send actually succeeds.
    if (!res.ok) {
      get().toast(await readApiError(res, "Couldn't send reply"), "error");
      return;
    }
    get().archive(email.id);
    get().toast(`Reply sent to ${email.from.email}`, "success");
  },

  saveDraft: async (email, body) => {
    set({ detailOpen: false, replyDraft: null });
    const res = await fetch("/api/drafts", {
      method: "POST",
      body: JSON.stringify({
        to: email.from.email,
        subject: /^re:/i.test(email.subject)
          ? email.subject
          : `Re: ${email.subject}`,
        body,
        threadId: email.threadId,
        inReplyTo: email.id,
      }),
    });
    if (res.ok) {
      get().toast(
        `Saved to Gmail drafts — reply to ${email.from.name}`,
        "success",
      );
    } else {
      get().toast(await readApiError(res, "Couldn't save draft"), "error");
    }
  },

  setFilter: (f) => set({ filter: f }),
  setSearch: (q) => set({ search: q }),
  setView: (v) => set({ view: v }),
  toggleCalendar: () => set((s) => ({ calendarExpanded: !s.calendarExpanded })),
  setPaletteOpen: (open) => set({ paletteOpen: open }),

  runPlan: async (plan) => {
    for (const action of plan.actions) {
      if (action.type === "create_event" && action.event) {
        const res = await fetch("/api/events", {
          method: "POST",
          body: JSON.stringify(action.event),
        });
        if (!res.ok) {
          get().toast(
            await readApiError(res, "Couldn't create the event"),
            "error",
          );
          continue;
        }
        const { event, shiftedFrom } = await res.json();
        set((s) => ({
          events: s.events.some((ev) => ev.id === event.id)
            ? s.events
            : [...s.events, event],
        }));
        get().toast(
          shiftedFrom
            ? `Invite sent: ${event.title} — moved to ${fmtTime(event.start)} (next free)`
            : `Invite sent: ${event.title}`,
          "success",
        );
      } else if (action.type === "send_email" && action.email) {
        const res = await fetch("/api/emails", {
          method: "POST",
          body: JSON.stringify(action.email),
        });
        if (!res.ok) {
          get().toast(
            await readApiError(res, "Couldn't send the email"),
            "error",
          );
          continue;
        }
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
      4000,
    );
  },

  bumpStreak: () => set((s) => ({ triageStreak: s.triageStreak + 1 })),
}));
