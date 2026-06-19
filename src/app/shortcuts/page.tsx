import type { Metadata } from "next";
import Link from "next/link";
import { Brand } from "@/components/Brand";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "Keyboard Shortcuts",
  description:
    "Every Tempo action has a single-key binding. The full keyboard cheat sheet for the fastest inbox you'll ever fly through.",
};

type Shortcut = { keys: string[]; label: string; hint?: string };

const GROUPS: { title: string; items: Shortcut[] }[] = [
  {
    title: "Navigate",
    items: [
      { keys: ["↑", "↓"], label: "Move through the timeline" },
      { keys: ["J", "K"], label: "Move down / up (vim-style)" },
      { keys: ["↵"], label: "Open the selected email" },
      { keys: ["0", "1", "2", "3"], label: "Jump between priority lanes" },
      { keys: ["/"], label: "Search your inbox" },
    ],
  },
  {
    title: "Act",
    items: [
      { keys: ["E"], label: "Archive" },
      { keys: ["R"], label: "AI reply", hint: "drafts a response you confirm" },
      {
        keys: ["S"],
        label: "Schedule",
        hint: "when the email has time-intent",
      },
      { keys: ["H"], label: "Snooze" },
      { keys: ["U"], label: "Undo the last action" },
    ],
  },
  {
    title: "Modes",
    items: [
      { keys: ["T"], label: "Enter Speed Triage" },
      { keys: ["C"], label: "Expand the calendar panel" },
      { keys: ["⌘", "K"], label: "Open the agent palette" },
      { keys: ["Esc"], label: "Close any overlay or mode" },
    ],
  },
];

export default function Shortcuts() {
  return (
    <div className="min-h-screen flex flex-col text-zinc-100">
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between px-6 h-16">
        <Brand />
        <Link
          href="/app"
          className="text-sm px-4 py-1.5 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
        >
          Open app
        </Link>
      </header>

      <main className="max-w-4xl mx-auto w-full px-6 pt-10 pb-20 flex-1">
        <div className="font-mono text-[13px] text-violet-400/80 mb-2">
          {"// cheat sheet"}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Keyboard shortcuts
        </h1>
        <p className="mt-3 text-zinc-400 max-w-xl leading-relaxed">
          Tempo is built for people who&apos;d rather not touch a mouse. Every
          core action is a single keystroke — here&apos;s the whole map.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {GROUPS.map((group) => (
            <section
              key={group.title}
              className="rounded-2xl border border-white/8 bg-white/3 p-5"
            >
              <h2 className="font-mono text-[12px] uppercase tracking-wider text-zinc-500 mb-4">
                {group.title}
              </h2>
              <ul className="space-y-3.5">
                {group.items.map((s) => (
                  <li key={s.label} className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-zinc-200">{s.label}</div>
                      {s.hint && (
                        <div className="text-[12px] text-zinc-500">{s.hint}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      {s.keys.map((k) => (
                        <kbd key={k}>{k}</kbd>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-violet-500/20 bg-violet-500/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="font-semibold">Muscle memory is the feature.</div>
            <p className="text-sm text-zinc-400 mt-1">
              Learn five of these and inbox zero becomes a sub-minute habit.
            </p>
          </div>
          <Link
            href="/app"
            className="shrink-0 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-colors"
          >
            Try it now →
          </Link>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
