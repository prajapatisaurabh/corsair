"use client";

import Link from "next/link";
import { useTempo, visibleEmails } from "@/lib/store";

export function TopBar() {
  const { live, filter, setFilter, emails, setView, setPaletteOpen } = useTempo();
  const counts = {
    all: visibleEmails(emails, "all").length,
    urgent: visibleEmails(emails, "urgent").length,
    normal: visibleEmails(emails, "normal").length,
    low: visibleEmails(emails, "low").length,
  };

  const lanes = [
    { key: "all", label: "All", kbd: "0" },
    { key: "urgent", label: "Urgent", kbd: "1", dot: "bg-rose-400" },
    { key: "normal", label: "Normal", kbd: "2", dot: "bg-sky-400" },
    { key: "low", label: "Low", kbd: "3", dot: "bg-zinc-500" },
  ] as const;

  return (
    <header className="flex items-center gap-4 px-4 h-12 border-b border-white/8 bg-[#0d0d14] shrink-0">
      <Link
        href="/"
        title="Back to home"
        className="flex items-center gap-2 rounded-md px-1 -mx-1 hover:bg-white/5"
      >
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-[15px] font-bold text-white">
          T
        </div>
        <span className="font-semibold tracking-tight text-[17px]">Tempo</span>
      </Link>

      <nav className="flex items-center gap-1 ml-4">
        {lanes.map((l) => (
          <button
            key={l.key}
            onClick={() => setFilter(l.key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[14px] transition-colors ${
              filter === l.key
                ? "bg-white/10 text-white"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
            }`}
          >
            {"dot" in l && l.dot && <span className={`w-1.5 h-1.5 rounded-full ${l.dot}`} />}
            {l.label}
            <span className="text-zinc-500">{counts[l.key]}</span>
          </button>
        ))}
      </nav>

      <div className="flex-1" />

      <button
        onClick={() => setView("triage")}
        className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[14px] text-zinc-300 hover:bg-white/5 border border-white/10"
      >
        ⚡ Triage <kbd>T</kbd>
      </button>
      <button
        onClick={() => setPaletteOpen(true)}
        className="flex items-center gap-2 px-2.5 py-1 rounded-md text-[14px] text-zinc-300 hover:bg-white/5 border border-white/10 animate-pulse-glow"
      >
        ✦ Ask agent <kbd>⌘K</kbd>
      </button>

      <span
        className={`flex items-center gap-1.5 text-[13px] px-2 py-0.5 rounded-full border ${
          live
            ? "text-emerald-300 border-emerald-500/30 bg-emerald-500/10"
            : "text-amber-300/90 border-amber-500/30 bg-amber-500/10"
        }`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${live ? "bg-emerald-400" : "bg-amber-400"}`} />
        {live ? "Live · Corsair" : "Not connected"}
      </span>
    </header>
  );
}
