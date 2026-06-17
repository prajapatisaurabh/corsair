"use client";

import { useEffect } from "react";
import { useTempo } from "@/lib/store";
import { TopBar } from "@/components/TopBar";
import { InboxList } from "@/components/InboxList";
import { CalendarPanel } from "@/components/CalendarPanel";
import { EmailDetail } from "@/components/EmailDetail";
import { TriageMode } from "@/components/TriageMode";
import { CommandPalette } from "@/components/CommandPalette";
import { Toasts } from "@/components/Toasts";
import { ShortcutBar } from "@/components/ShortcutBar";

export default function Home() {
  const calendarExpanded = useTempo((s) => s.calendarExpanded);

  useEffect(() => {
    const s = useTempo.getState();
    s.load();
    s.connectStream();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useTempo.getState();

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        s.setPaletteOpen(!s.paletteOpen);
        return;
      }
      // overlays own their keys
      if (s.paletteOpen || s.view === "triage") {
        if (e.key === "Escape") s.closeOverlays();
        return;
      }
      const target = e.target as HTMLElement;
      if (target.tagName === "TEXTAREA" || target.tagName === "INPUT") return;

      // "/" jumps to search from anywhere in the inbox.
      if (e.key === "/") {
        e.preventDefault();
        document.getElementById("tempo-search")?.focus();
        return;
      }

      switch (e.key) {
        case "Escape":
          s.closeOverlays();
          break;
        case "u":
          s.undo();
          break;
        case "j":
        case "ArrowDown":
          e.preventDefault();
          s.moveSelection(1);
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          s.moveSelection(-1);
          break;
        case "Enter":
          s.openDetail();
          break;
        case "e":
          if (s.selectedId) s.archive(s.selectedId);
          break;
        case "r":
          s.openDetail(true);
          break;
        case "s":
          if (s.selectedId) s.schedule(s.selectedId);
          break;
        case "h":
          if (s.selectedId) s.snooze(s.selectedId);
          break;
        case "t":
          s.setView("triage");
          break;
        case "c":
          s.toggleCalendar();
          break;
        case "0":
          s.setFilter("all");
          break;
        case "1":
          s.setFilter("urgent");
          break;
        case "2":
          s.setFilter("normal");
          break;
        case "3":
          s.setFilter("low");
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <main className="relative h-screen w-screen flex flex-col overflow-hidden">
      <TopBar />
      <div className="flex flex-1 min-h-0">
        <div
          className={`flex flex-col min-w-0 transition-[width] duration-200 ${
            calendarExpanded ? "w-[320px] shrink-0" : "flex-1"
          }`}
        >
          <InboxList />
        </div>
        <CalendarPanel />
      </div>
      <ShortcutBar />

      <EmailDetail />
      <TriageMode />
      <CommandPalette />
      <Toasts />
    </main>
  );
}
