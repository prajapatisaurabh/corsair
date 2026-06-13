import Link from "next/link";
import { isConnected } from "@/server/corsair";

const FEATURES = [
  {
    icon: "⏰",
    title: "Email that thinks in time",
    desc: "Tempo detects “can we sync tomorrow at 2pm?” and turns the email into a calendar block — one keystroke sends the invite.",
  },
  {
    icon: "⚡",
    title: "Speed triage",
    desc: "One email at a time, single-key decisions. Archive, schedule, AI-reply, snooze. Inbox zero in under a minute.",
  },
  {
    icon: "✦",
    title: "Agent palette",
    desc: "⌘K and tell it what to do: “invite dev@corsair.dev Thursday 9am and email him too.” Preview, press Enter, done.",
  },
  {
    icon: "📡",
    title: "Realtime, no polling",
    desc: "Corsair webhooks push new mail straight into your timeline, pre-classified by priority with time-intent already parsed.",
  },
];

export default async function Landing() {
  const connected = await isConnected();
  return (
    <div className="min-h-screen bg-[#0b0a12] text-zinc-100">
      <header className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white">
            T
          </div>
          <span className="font-semibold tracking-tight text-lg">Tempo</span>
        </div>
        <nav className="flex items-center gap-3 text-sm">
          {connected ? (
            <Link
              href="/app"
              className="px-4 py-1.5 rounded-lg bg-white text-black font-medium hover:bg-zinc-200"
            >
              Open app
            </Link>
          ) : (
            <>
              <Link
                href="/app"
                className="text-zinc-400 hover:text-white px-3 py-1.5"
              >
                Open app
              </Link>
              <Link
                href="/login"
                className="px-4 py-1.5 rounded-lg bg-white text-black font-medium hover:bg-zinc-200"
              >
                Sign in
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="max-w-5xl mx-auto px-6">
        <section className="pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 text-[14px] text-violet-300 border border-violet-500/30 bg-violet-500/10 rounded-full px-3 py-1 mb-6">
            Built on Corsair · Gmail + Google Calendar · Corsair Hackathon
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Your inbox,
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              on your time.
            </span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto">
            Almost every important email is secretly about time. Tempo fuses
            Gmail and Google Calendar into one keyboard-first timeline — so
            scheduling is a keystroke, not a tab-switch.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            {connected ? (
              <Link
                href="/app"
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold"
              >
                Open inbox →
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold"
              >
                Connect Google →
              </Link>
            )}
          </div>
          <p className="mt-4 text-[14px] text-zinc-600">
            One sign-in connects Gmail and Calendar — tokens encrypted by
            Corsair.
          </p>
        </section>

        <section className="grid sm:grid-cols-2 gap-4 pb-20">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 hover:border-violet-500/30 transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-white/8 py-6 text-center text-[14px] text-zinc-600">
        Tempo · powered by Corsair · Builder Mode On | MacBook Giveaway
        Hackathon
      </footer>
    </div>
  );
}
