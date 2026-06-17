"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTempo, visibleEmails } from "@/lib/store";
import { addDays, fmtDay, fmtTime, startOfDay } from "@/lib/time";
import { CalendarEvent } from "@/lib/types";

const emptySubscribe = () => () => {};
/** false during SSR/hydration, true on the client — no state, no effect. */
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

const START_HOUR = 7;
const END_HOUR = 22;
const HOUR_PX = 44;
const DAYS = 3;

const COLOR: Record<string, string> = {
  indigo: "bg-indigo-500/20 border-indigo-400/50 text-indigo-200",
  violet: "bg-violet-500/20 border-violet-400/50 text-violet-200",
  slate: "bg-slate-500/20 border-slate-400/50 text-slate-300",
  emerald: "bg-emerald-500/20 border-emerald-400/50 text-emerald-200",
  amber: "bg-amber-500/25 border-amber-400/60 text-amber-100",
};

export function CalendarPanel() {
  const { events, emails, schedule, calendarExpanded, toggleCalendar } =
    useTempo();
  // Detailed view shows a full week and fills the workspace; the rail shows 3 days.
  const dayCount = calendarExpanded ? 7 : DAYS;
  const widthClass = calendarExpanded ? "flex-1 min-w-0" : "w-[420px] shrink-0";
  // Time-of-day rendering only happens client-side to avoid SSR hydration
  // mismatches (the "now" line and day labels depend on the clock).
  const hydrated = useHydrated();
  // Which 3-day window we're looking at (0 = starting today). Lets the user
  // page through all of the backfilled days, not just the first three.
  const [offset, setOffset] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // On first paint, scroll so the current hour sits near the top — no manual
  // scrolling to find "now".
  useEffect(() => {
    if (!hydrated || !scrollRef.current) return;
    const nowHour = new Date().getHours();
    scrollRef.current.scrollTop = Math.max(
      0,
      (nowHour - START_HOUR - 1) * HOUR_PX,
    );
  }, [hydrated]);

  if (!hydrated) {
    return (
      <aside className={`${widthClass} border-l border-white/8 bg-[#0e0c16]`} />
    );
  }
  const today = startOfDay(new Date());
  const windowStart = addDays(today, offset);
  const days = Array.from({ length: dayCount }, (_, i) =>
    addDays(windowStart, i),
  );
  const unscheduled = visibleEmails(emails, "all").filter(
    (e) => e.timeIntent && !e.scheduledEventId,
  );

  return (
    <aside
      className={`${widthClass} border-l border-white/8 bg-[#0e0c16] flex flex-col`}
    >
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/8">
        <button
          onClick={() => setOffset((o) => o - dayCount)}
          className="px-2 py-0.5 rounded-md text-[13px] text-zinc-400 hover:bg-white/5"
          title="Earlier days"
        >
          ‹
        </button>
        <button
          onClick={() => setOffset(0)}
          className={`text-[13px] px-2 py-0.5 rounded-md transition-colors ${
            offset === 0
              ? "text-zinc-500"
              : "text-violet-300 hover:bg-violet-500/10"
          }`}
        >
          {offset === 0
            ? calendarExpanded
              ? "This week"
              : "Next days"
            : "Jump to today"}
        </button>
        <button
          onClick={() => setOffset((o) => o + dayCount)}
          className="px-2 py-0.5 rounded-md text-[13px] text-zinc-400 hover:bg-white/5"
          title="Later days"
        >
          ›
        </button>
        <div className="flex-1" />
        <button
          onClick={toggleCalendar}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[13px] text-zinc-300 hover:bg-white/5 border border-white/10"
          title={calendarExpanded ? "Collapse calendar" : "Expand calendar"}
        >
          {calendarExpanded ? "⤡ Collapse" : "⤢ Expand"}
          <kbd>C</kbd>
        </button>
      </div>
      {unscheduled.length > 0 && (
        <div className="px-3 py-2 border-b border-white/8">
          <div className="text-[12px] uppercase tracking-wider text-zinc-500 mb-1.5">
            Waiting to be scheduled
          </div>
          <div className="flex flex-col gap-1">
            {unscheduled.slice(0, 3).map((e) => (
              <button
                key={e.id}
                onClick={() => schedule(e.id)}
                className="flex items-center justify-between gap-2 text-left text-[13px] px-2 py-1.5 rounded-md bg-amber-500/10 border border-dashed border-amber-500/35 text-amber-200 hover:bg-amber-500/20 transition-colors"
              >
                <span className="truncate">
                  {e.from.name}: {e.timeIntent!.phrase}
                </span>
                <span className="shrink-0 text-amber-400/80">snap ↘</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className="grid shrink-0 border-b border-white/8"
        style={{ gridTemplateColumns: `40px repeat(${dayCount}, 1fr)` }}
      >
        <div />
        {days.map((d, i) => {
          const isToday = d.getTime() === today.getTime();
          return (
            <div key={i} className="px-2 py-1.5 text-[13px] text-center">
              <span
                className={
                  isToday ? "text-violet-300 font-semibold" : "text-zinc-400"
                }
              >
                {isToday ? "Today" : fmtDay(d)}
              </span>
            </div>
          );
        })}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `40px repeat(${dayCount}, 1fr)`,
            height: (END_HOUR - START_HOUR) * HOUR_PX,
          }}
        >
          <div className="relative">
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <div
                key={i}
                className="absolute right-1.5 text-[11px] text-zinc-600 -translate-y-1/2"
                style={{ top: i * HOUR_PX }}
              >
                {((START_HOUR + i - 1) % 12) + 1}
                {START_HOUR + i < 12 ? "a" : "p"}
              </div>
            ))}
          </div>

          {days.map((day, di) => (
            <DayColumn
              key={di}
              day={day}
              events={events}
              isToday={day.getTime() === today.getTime()}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

function DayColumn({
  day,
  events,
  isToday,
}: {
  day: Date;
  events: CalendarEvent[];
  isToday: boolean;
}) {
  const dayStart = new Date(day);
  dayStart.setHours(START_HOUR, 0, 0, 0);
  const dayEvents = events.filter(
    (ev) => startOfDay(new Date(ev.start)).getTime() === day.getTime(),
  );

  const now = new Date();
  const nowOffset = ((now.getTime() - dayStart.getTime()) / 3600_000) * HOUR_PX;

  return (
    <div className="relative border-l border-white/6">
      {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
        <div
          key={i}
          className="absolute left-0 right-0 border-t border-white/5"
          style={{ top: i * HOUR_PX }}
        />
      ))}

      {isToday &&
        nowOffset > 0 &&
        nowOffset < (END_HOUR - START_HOUR) * HOUR_PX && (
          <div
            className="absolute left-0 right-0 z-10 flex items-center"
            style={{ top: nowOffset }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 -ml-0.5 shadow-[0_0_8px_2px_rgba(244,63,94,0.6)]" />
            <div className="flex-1 h-px bg-rose-400/70 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
          </div>
        )}

      {dayEvents.map((ev) => {
        const start = new Date(ev.start);
        const end = new Date(ev.end);
        const top =
          ((start.getTime() - dayStart.getTime()) / 3600_000) * HOUR_PX;
        const height = Math.max(
          22,
          ((end.getTime() - start.getTime()) / 3600_000) * HOUR_PX - 2,
        );
        if (top + height < 0 || top > (END_HOUR - START_HOUR) * HOUR_PX)
          return null;
        return (
          <div
            key={ev.id}
            className={`absolute left-0.5 right-1 rounded-md border px-1.5 py-1 overflow-hidden animate-pop-in ${
              COLOR[ev.color ?? "violet"]
            } ${ev.sourceEmailId ? "border-solid" : ""}`}
            style={{ top: Math.max(0, top), height }}
            title={`${ev.title} · ${fmtTime(ev.start)}–${fmtTime(ev.end)}`}
          >
            <div className="text-[12px] font-medium leading-tight truncate">
              {ev.sourceEmailId && "✉ "}
              {ev.title}
            </div>
            {height > 34 && (
              <div className="text-[11px] opacity-70">
                {fmtTime(ev.start)} ·{" "}
                {ev.attendees.filter((a) => a !== "me@tempo.app").join(", ") ||
                  "just you"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
