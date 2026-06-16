"use client";

import { useEffect, useRef, useState } from "react";
import { useTempo } from "@/lib/store";
import { AgentPlan } from "@/lib/types";

const SUGGESTIONS = [
  "Send a calendar invite to saurabhprajapati120@gmail.com at 9 AM next Thursday. Send him an email too saying I look forward to our meeting.",
  "Schedule a 45 min sync with piyush@teachyst.com tomorrow at 4pm",
  "Email hitesh@chaicode.com saying the demo is ready",
];

/**
 * ⌘K agent palette — natural language in, previewed Corsair actions out.
 * Nothing executes until the user confirms with Enter.
 */
export function CommandPalette() {
  const { paletteOpen, setPaletteOpen, runPlan } = useTempo();
  const [input, setInput] = useState("");
  const [plan, setPlan] = useState<AgentPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Reset fields the moment the palette opens (state-during-render pattern).
  const [wasOpen, setWasOpen] = useState(paletteOpen);
  if (wasOpen !== paletteOpen) {
    setWasOpen(paletteOpen);
    if (paletteOpen) {
      setInput("");
      setPlan(null);
    }
  }

  // Focus is a real DOM side effect — that part stays in an effect.
  useEffect(() => {
    if (paletteOpen) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [paletteOpen]);

  if (!paletteOpen) return null;

  const submit = async () => {
    if (!input.trim() || loading) return;
    setLoading(true);
    setPlan(null);
    const res = await fetch("/api/agent", {
      method: "POST",
      body: JSON.stringify({ command: input }),
    });
    setPlan(await res.json());
    setLoading(false);
  };

  const execute = async () => {
    if (!plan || executing) return;
    setExecuting(true);
    await runPlan(plan);
    setExecuting(false);
  };

  const runnable = plan?.actions.some((a) => a.type !== "unknown");

  return (
    <div
      className="absolute inset-0 z-50 bg-black/60 backdrop-blur-[3px] flex items-start justify-center pt-[18vh]"
      onClick={() => setPaletteOpen(false)}
    >
      <div
        className="w-[680px] bg-[#151223] border border-white/12 rounded-xl shadow-2xl animate-pop-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/8">
          <span className="text-violet-400">✦</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") plan && runnable ? execute() : submit();
              if (e.key === "Escape") setPaletteOpen(false);
            }}
            placeholder="Tell the agent what to do…"
            className="flex-1 bg-transparent text-[16px] focus:outline-none placeholder:text-zinc-600"
          />
          {loading && (
            <span className="text-[13px] text-zinc-500 animate-pulse">
              planning…
            </span>
          )}
        </div>

        {!plan && !loading && (
          <div className="px-4 py-3">
            <div className="text-[12px] uppercase tracking-wider text-zinc-600 mb-2">
              Try
            </div>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="block w-full text-left text-[14px] text-zinc-400 hover:text-zinc-100 hover:bg-white/5 rounded-md px-2 py-1.5 truncate"
              >
                “{s}”
              </button>
            ))}
          </div>
        )}

        {plan && (
          <div className="px-4 py-3">
            <div className="text-[14px] text-zinc-400 mb-2.5">{plan.reply}</div>
            <div className="flex flex-col gap-1.5">
              {plan.actions.map((a, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-[14px] ${
                    a.type === "unknown"
                      ? "border-white/8 text-zinc-500"
                      : a.type === "create_event"
                        ? "border-violet-500/30 bg-violet-500/8 text-violet-100"
                        : "border-sky-500/30 bg-sky-500/8 text-sky-100"
                  }`}
                >
                  <span className="text-base">
                    {a.type === "create_event"
                      ? "📅"
                      : a.type === "send_email"
                        ? "✉️"
                        : "❔"}
                  </span>
                  <span className="flex-1 truncate">{a.summary}</span>
                  {a.email && (
                    <span className="text-[13px] text-zinc-500 truncate max-w-[180px]">
                      “
                      {a.email.body
                        .split("\n")
                        .find((l) => l.trim() && !l.startsWith("Hi"))
                        ?.trim()}
                      ”
                    </span>
                  )}
                </div>
              ))}
            </div>
            {runnable && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => setPlan(null)}
                  className="text-[14px] text-zinc-500 hover:text-zinc-300"
                >
                  ← edit command
                </button>
                <button
                  onClick={execute}
                  disabled={executing}
                  className="text-[14px] px-4 py-1.5 rounded-md bg-violet-600 hover:bg-violet-500 font-semibold disabled:opacity-50"
                >
                  {executing ? "Running via Corsair…" : "Execute"}{" "}
                  <kbd className="!bg-black/25">↵</kbd>
                </button>
              </div>
            )}
          </div>
        )}

        <div className="px-4 py-2 border-t border-white/8 text-[12px] text-zinc-600 flex gap-4">
          <span>Powered by Corsair MCP · Gmail + Google Calendar</span>
          <span className="ml-auto">
            <kbd>↵</kbd> plan / run · <kbd>Esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
