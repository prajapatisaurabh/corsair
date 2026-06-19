import Link from "next/link";
import Image from "next/image";
import { Brand } from "@/components/Brand";
import { SiteFooter } from "@/components/SiteFooter";

// CTAs point at /app unconditionally: the /app layout guards auth server-side,
// sending connected users into the inbox and everyone else to /login. That keeps
// this marketing page free of per-request session reads, so it prerenders static.
const PRIMARY_HREF = "/app";
const PRIMARY_LABEL = "Open Tempo →";

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
    desc: "Hit ⌘K and just say it: “invite alex Thursday 9am and email him too.” Preview, press Enter, done.",
  },
  {
    icon: "📡",
    title: "Realtime, no polling",
    desc: "Corsair webhooks push new mail straight into your timeline, pre-classified by priority with time-intent already parsed.",
  },
];

const STEPS = [
  {
    k: "01",
    title: "Connect Google once",
    desc: "One OAuth grant wires up Gmail and Calendar. Tokens are envelope-encrypted by Corsair — they never touch the browser.",
  },
  {
    k: "02",
    title: "Triage at the speed of thought",
    desc: "Your inbox becomes a timeline. Single keys move you through it; Tempo surfaces the time hidden in every thread.",
  },
  {
    k: "03",
    title: "Schedule without leaving",
    desc: "Accept a proposed time, fire off a reply, or open ⌘K and describe what you want. No tab-switch, no copy-paste.",
  },
];

const FAQ = [
  {
    q: "Is my email data safe?",
    a: "Yes. Google tokens are envelope-encrypted and stored server-side by Corsair in Postgres. They never reach the browser or the agent, and you can revoke access from your Google account at any time.",
  },
  {
    q: "Do I need a credit card?",
    a: "No. Tempo was built for the Corsair hackathon — connect your Google account and start triaging immediately.",
  },
  {
    q: "Is it really keyboard-first?",
    a: "Down to the bone. Every core action has a single-key binding, and ⌘K opens an agent palette that understands plain English. Your mouse is optional.",
  },
  {
    q: "What does the agent actually do?",
    a: "It drafts replies, parses scheduling intent, and creates or updates calendar events — but only ever after you preview and confirm. Nothing is sent on your behalf without a keystroke.",
  },
];

export default function Landing() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <div className="min-h-screen flex flex-col text-zinc-100 overflow-x-clip">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <header className="sticky top-0 z-20 backdrop-blur-md bg-[#0b0a12]/70 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-16">
          <Brand />
          <nav className="flex items-center gap-1 sm:gap-3 text-sm">
            <Link
              href="/shortcuts"
              className="hidden sm:inline text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
            >
              Shortcuts
            </Link>
            <Link
              href="/app"
              className="text-zinc-400 hover:text-white px-3 py-1.5 transition-colors"
            >
              Open app
            </Link>
            <Link
              href="/login"
              className="px-4 py-1.5 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 w-full">
        {/* Hero */}
        <section className="pt-20 pb-14 text-center">
          <div className="inline-flex items-center gap-2 text-[13px] font-mono text-violet-300 border border-violet-500/30 bg-violet-500/10 rounded-full px-3 py-1 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
            Gmail + Google Calendar · built on Corsair
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-[1.05]">
            Your inbox,
            <br />
            <span className="bg-linear-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              on your time.
            </span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400 max-w-xl mx-auto leading-relaxed">
            Almost every important email is secretly about time. Tempo fuses
            Gmail and Google Calendar into one keyboard-first timeline — so
            scheduling is a keystroke, not a tab-switch.
          </p>
          <div className="mt-9 flex items-center justify-center gap-3">
            <Link
              href={PRIMARY_HREF}
              className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-colors shadow-lg shadow-violet-600/25"
            >
              {PRIMARY_LABEL}
            </Link>
            <Link
              href="/shortcuts"
              className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-medium transition-colors"
            >
              See the shortcuts
            </Link>
          </div>
          <p className="mt-4 text-[13px] text-zinc-500">
            One sign-in connects Gmail and Calendar — tokens encrypted by
            Corsair.
          </p>
        </section>

        {/* Product shot — breaks out wider than the text column so the UI reads big */}
        <section className="pb-20">
          <div className="relative left-1/2 w-screen -translate-x-1/2">
            <div className="mx-auto max-w-375 px-4 sm:px-6">
              <div className="relative">
                {/* Soft gradient glow behind the screenshot */}
                <div
                  aria-hidden
                  className="absolute -inset-x-10 -top-10 bottom-0 bg-linear-to-tr from-violet-600/20 via-fuchsia-500/10 to-transparent blur-3xl"
                />
                <div className="relative rounded-2xl border border-white/10 bg-white/3 p-1.5 shadow-2xl shadow-black/50">
                  <Image
                    src="/product-image-1.jpg"
                    alt="The Tempo inbox — emails sorted into priority lanes beside a “waiting to be scheduled” panel"
                    width={1918}
                    height={962}
                    priority
                    quality={90}
                    sizes="100vw"
                    className="rounded-xl w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <SectionHeading kicker="// why tempo" title="Less inbox, more done" />
        <section className="grid sm:grid-cols-2 gap-4 pb-20">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-white/8 bg-white/3 p-6 hover:border-violet-500/30 hover:bg-white/5 transition-colors"
            >
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>

        {/* How it works */}
        <SectionHeading
          kicker="// how it works"
          title="Three steps to inbox zero"
        />
        <section className="grid sm:grid-cols-3 gap-4 pb-20">
          {STEPS.map((s) => (
            <div
              key={s.k}
              className="rounded-2xl border border-white/8 bg-white/3 p-6"
            >
              <div className="font-mono text-2xl text-violet-400/80 mb-3">
                {s.k}
              </div>
              <h3 className="font-semibold mb-1.5">{s.title}</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </section>

        {/* Agent palette screenshot */}
        <SectionHeading kicker="// the agent" title="Just tell it what to do" />
        <section className="pb-20">
          <div className="relative left-1/2 w-screen -translate-x-1/2">
            <div className="mx-auto max-w-375 px-4 sm:px-6">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute -inset-x-10 -top-10 bottom-0 bg-linear-to-tr from-fuchsia-600/15 via-violet-500/10 to-transparent blur-3xl"
                />
                <div className="relative rounded-2xl border border-white/10 bg-white/3 p-1.5 shadow-2xl shadow-black/50">
                  <Image
                    src="/product-image-2.jpg"
                    alt="The Tempo ⌘K agent palette open — “Tell the agent what to do…” with example commands"
                    width={1918}
                    height={964}
                    quality={90}
                    sizes="100vw"
                    className="rounded-xl w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <SectionHeading kicker="// faq" title="Good questions" />
        <section className="pb-20 max-w-3xl mx-auto w-full space-y-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-xl border border-white/8 bg-white/3 px-5 py-4 [&_summary]:cursor-pointer"
            >
              <summary className="flex items-center justify-between font-medium list-none">
                {item.q}
                <span className="text-zinc-500 transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                {item.a}
              </p>
            </details>
          ))}
        </section>

        {/* Closing CTA */}
        <section className="pb-24">
          <div className="rounded-3xl border border-violet-500/20 bg-linear-to-br from-violet-500/10 to-fuchsia-500/5 p-10 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Stop tab-switching to schedule.
            </h2>
            <p className="mt-3 text-zinc-400 max-w-md mx-auto">
              Connect once and let Tempo turn your inbox into a timeline you can
              fly through.
            </p>
            <Link
              href={PRIMARY_HREF}
              className="mt-7 inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-colors shadow-lg shadow-violet-600/25"
            >
              {PRIMARY_LABEL}
            </Link>
          </div>
        </section>

        {/* Hackathon credit */}
        <section className="pb-24">
          <div className="max-w-xl mx-auto text-center">
            <div className="font-mono text-[12px] uppercase tracking-wider text-zinc-500 mb-4">
              Proudly built for
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/3 p-2 overflow-hidden">
              <Image
                src="/hackathon.png"
                alt="ChaiCode × Corsair Hackathon — live, with a MacBook Air prize"
                width={1200}
                height={630}
                className="rounded-xl w-full h-auto"
              />
            </div>
            <p className="mt-4 text-[13px] text-zinc-500">
              The ChaiCode × Corsair Hackathon · Web Dev 2026 Cohort
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="text-center mb-8">
      <div className="font-mono text-[13px] text-violet-400/80 mb-2">
        {kicker}
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight">
        {title}
      </h2>
    </div>
  );
}
