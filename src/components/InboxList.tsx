"use client";

import { useEffect, useRef, useState } from "react";
import { useTempo, visibleEmails } from "@/lib/store";
import { relativeTime } from "@/lib/time";
import { Email, Priority } from "@/lib/types";

function EmptyState() {
  const { live, emails, toast } = useTempo();
  const [syncing, setSyncing] = useState(false);

  const hasEmails = emails.length > 0;

  const triggerSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      if (res.ok) {
        const { emails: count } = await res.json();
        toast(`Synced ${count} emails`, "success");
        useTempo.getState().load();
      } else {
        const { error } = await res.json();
        toast(error ?? "Sync failed", "error");
      }
    } catch {
      toast("Could not reach server", "error");
    }
    setSyncing(false);
  };

  if (hasEmails) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 gap-2">
        <div className="text-4xl">🎉</div>
        <div className="text-sm">Inbox zero. Go build something.</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-6">
      <div className="text-4xl">📭</div>
      <div>
        <p className="text-zinc-300 font-medium">No emails loaded yet</p>
        <p className="text-zinc-500 text-sm mt-1">
          {live
            ? "Your Gmail is connected. Click below to pull your inbox."
            : "Connect your Google account to get started."}
        </p>
      </div>
      {live ? (
        <button
          onClick={triggerSync}
          disabled={syncing}
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-sm font-medium transition-colors"
        >
          {syncing ? "Syncing…" : "Sync inbox now"}
        </button>
      ) : (
        <a
          href="/login"
          className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors"
        >
          Connect Google →
        </a>
      )}
    </div>
  );
}

const PRIORITY_META: Record<
  Priority,
  { label: string; dot: string; text: string }
> = {
  urgent: { label: "Urgent", dot: "bg-rose-400", text: "text-rose-300" },
  normal: { label: "Normal", dot: "bg-sky-400", text: "text-sky-300" },
  low: { label: "Low", dot: "bg-zinc-500", text: "text-zinc-400" },
};

export function InboxList() {
  const { emails, filter, selectedId, select, openDetail } = useTempo();
  const list = visibleEmails(emails, filter);

  const groups: { priority: Priority; items: Email[] }[] = (
    ["urgent", "normal", "low"] as Priority[]
  )
    .map((p) => ({ priority: p, items: list.filter((e) => e.priority === p) }))
    .filter((g) => g.items.length > 0);

  if (!list.length) {
    return <EmptyState />;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {groups.map((g) => (
        <section key={g.priority}>
          <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-1.5 text-[13px] uppercase tracking-wider text-zinc-500 bg-[#0b0a12]/95 backdrop-blur">
            <span
              className={`w-1.5 h-1.5 rounded-full ${PRIORITY_META[g.priority].dot}`}
            />
            {PRIORITY_META[g.priority].label}
            <span className="text-zinc-600">{g.items.length}</span>
          </div>
          {g.items.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              selected={email.id === selectedId}
              onClick={() => {
                select(email.id);
                openDetail();
              }}
            />
          ))}
        </section>
      ))}
      <div className="h-16" />
    </div>
  );
}

function EmailRow({
  email,
  selected,
  onClick,
}: {
  email: Email;
  selected: boolean;
  onClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected) ref.current?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`group flex items-center gap-3 px-4 py-2.5 cursor-pointer border-l-2 animate-slide-in ${
        selected
          ? "bg-violet-500/10 border-violet-400"
          : "border-transparent hover:bg-white/4"
      }`}
    >
      <div
        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[13px] font-semibold ${
          email.unread
            ? "bg-violet-500/25 text-violet-200"
            : "bg-white/8 text-zinc-400"
        }`}
      >
        {email.from.name
          .split(" ")
          .slice(0, 2)
          .map((w) => w[0])
          .join("")}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`text-[15px] truncate ${
              email.unread ? "font-semibold text-white" : "text-zinc-300"
            }`}
          >
            {email.from.name}
          </span>
          {email.timeIntent && !email.scheduledEventId && (
            <span className="shrink-0 flex items-center gap-1 text-[12px] px-1.5 py-px rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
              ⏰ {email.timeIntent.phrase}
              <kbd className="!bg-amber-500/20 !border-amber-500/30 !text-amber-200">
                S
              </kbd>
            </span>
          )}
        </div>
        <div className="text-[14px] text-zinc-400 truncate">
          <span className={email.unread ? "text-zinc-200" : ""}>
            {email.subject}
          </span>
          <span className="text-zinc-600"> — {email.snippet}</span>
        </div>
      </div>

      <span className="text-[13px] text-zinc-500 shrink-0">
        {relativeTime(email.receivedAt)}
      </span>
    </div>
  );
}
