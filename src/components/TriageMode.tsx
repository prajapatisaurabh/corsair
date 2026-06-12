"use client";

import { useEffect, useState } from "react";
import { useTempo, visibleEmails } from "@/lib/store";
import { relativeTime } from "@/lib/time";

/**
 * Speed Triage: one email at a time, single-keystroke decisions.
 * E archive · S schedule · H snooze · R reply · Esc exit.
 */
export function TriageMode() {
  const { emails, view, archive, snooze, schedule, select, openDetail, closeOverlays, triageStreak, bumpStreak } =
    useTempo();
  const [startedAt] = useState(Date.now());
  const [elapsed, setElapsed] = useState(0);

  const queue = visibleEmails(emails, "all");
  const current = queue[0];

  useEffect(() => {
    if (view !== "triage") return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [view, startedAt]);

  useEffect(() => {
    if (view !== "triage" || !current) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey) return;
      if (e.key === "e") {
        archive(current.id);
        bumpStreak();
      } else if (e.key === "h") {
        snooze(current.id);
        bumpStreak();
      } else if (e.key === "s" && current.timeIntent) {
        schedule(current.id);
        bumpStreak();
      } else if (e.key === "r") {
        select(current.id);
        closeOverlays();
        openDetail(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [view, current, archive, snooze, schedule, select, openDetail, closeOverlays, bumpStreak]);

  if (view !== "triage") return null;

  return (
    <div className="absolute inset-0 z-40 bg-[#0a0a0f]/97 backdrop-blur flex flex-col items-center justify-center">
      <div className="absolute top-5 left-6 text-[14px] text-zinc-500">
        ⚡ Speed triage — <span className="text-zinc-300">{queue.length} left</span>
      </div>
      <div className="absolute top-5 right-6 flex items-center gap-4 text-[14px]">
        <span className="text-violet-300">🔥 streak {triageStreak}</span>
        <span className="text-zinc-500">
          {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")}
        </span>
        <button onClick={closeOverlays} className="text-zinc-400 hover:text-white">
          exit <kbd>Esc</kbd>
        </button>
      </div>

      {!current ? (
        <div className="text-center animate-pop-in">
          <div className="text-6xl mb-4">🏁</div>
          <div className="text-xl font-semibold">Inbox zero in {elapsed}s</div>
          <div className="text-zinc-400 mt-1 text-sm">{triageStreak} emails triaged. Superhuman who?</div>
        </div>
      ) : (
        <div key={current.id} className="w-[640px] animate-pop-in">
          <div className="bg-[#13131c] border border-white/10 rounded-2xl p-7 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[15px]">
                <span className="font-semibold text-white">{current.from.name}</span>
                <span className="text-zinc-500">{current.from.email}</span>
              </div>
              <div className="flex items-center gap-2 text-[13px]">
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    current.priority === "urgent"
                      ? "bg-rose-500/15 text-rose-300"
                      : current.priority === "low"
                        ? "bg-zinc-500/15 text-zinc-400"
                        : "bg-sky-500/15 text-sky-300"
                  }`}
                >
                  {current.priority}
                </span>
                <span className="text-zinc-500">{relativeTime(current.receivedAt)}</span>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2">{current.subject}</h3>
            <p className="text-[15.5px] text-zinc-300 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {current.body}
            </p>
            {current.timeIntent && (
              <div className="mt-4 text-[14px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-md px-3 py-2 inline-block">
                ⏰ mentions {current.timeIntent.phrase}
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3 mt-6 text-[14px]">
            <Key k="E" label="Archive" />
            {current.timeIntent && <Key k="S" label="Schedule + invite" accent />}
            <Key k="R" label="Reply w/ AI" />
            <Key k="H" label="Snooze 3h" />
          </div>
        </div>
      )}
    </div>
  );
}

function Key({ k, label, accent }: { k: string; label: string; accent?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${
        accent
          ? "bg-amber-500/15 border-amber-500/40 text-amber-200"
          : "bg-white/5 border-white/10 text-zinc-300"
      }`}
    >
      <kbd className="!text-[14px]">{k}</kbd> {label}
    </div>
  );
}
