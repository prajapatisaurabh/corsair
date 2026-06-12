"use client";

const SHORTCUTS: [string, string][] = [
  ["↑↓ / JK", "navigate"],
  ["↵", "open"],
  ["E", "archive"],
  ["R", "AI reply"],
  ["S", "schedule"],
  ["H", "snooze"],
  ["T", "triage"],
  ["⌘K", "agent"],
  ["0-3", "lanes"],
];

export function ShortcutBar() {
  return (
    <footer className="h-8 shrink-0 border-t border-white/8 bg-[#0d0d14] flex items-center gap-4 px-4 overflow-x-auto">
      {SHORTCUTS.map(([k, label]) => (
        <span key={k} className="flex items-center gap-1.5 text-[12px] text-zinc-500 whitespace-nowrap">
          <kbd>{k}</kbd> {label}
        </span>
      ))}
      <span className="ml-auto text-[12px] text-zinc-600 whitespace-nowrap">
        Tempo · Corsair Hackathon · Builder Mode On
      </span>
    </footer>
  );
}
