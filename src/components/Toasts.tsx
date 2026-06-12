"use client";

import { useTempo } from "@/lib/store";

export function Toasts() {
  const { toasts } = useTempo();
  return (
    <div className="absolute bottom-12 right-4 z-[60] flex flex-col gap-2 items-end pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-slide-in text-[14px] px-3.5 py-2 rounded-lg border shadow-xl max-w-[380px] ${
            t.kind === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-100"
              : t.kind === "error"
                ? "bg-rose-950/90 border-rose-500/40 text-rose-100"
                : "bg-[#191529]/95 border-white/15 text-zinc-200"
          }`}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
