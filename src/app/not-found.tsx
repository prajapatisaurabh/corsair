import Link from "next/link";
import { Brand } from "@/components/Brand";
import { SiteFooter } from "@/components/SiteFooter";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col text-zinc-100">
      <header className="max-w-5xl mx-auto w-full flex items-center px-6 h-16">
        <Brand />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-white/10 bg-[#13111d]/80 shadow-2xl shadow-black/40 overflow-hidden">
            <div className="flex items-center gap-2 px-4 h-10 border-b border-white/8">
              <span className="w-3 h-3 rounded-full bg-red-400/70" />
              <span className="w-3 h-3 rounded-full bg-amber-400/70" />
              <span className="w-3 h-3 rounded-full bg-green-400/70" />
              <span className="ml-3 font-mono text-[12px] text-zinc-500">
                tempo — error
              </span>
            </div>
            <div className="p-6 font-mono text-[13.5px] leading-relaxed">
              <div className="text-zinc-400">
                <span className="text-violet-400">❯</span> open page
              </div>
              <div className="mt-2 text-rose-300">
                404 · this page got snoozed and never came back.
              </div>
              <div className="mt-1 text-zinc-500">
                The link is broken or the page has moved.
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              href="/"
              className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold transition-colors"
            >
              Back home
            </Link>
            <Link
              href="/app"
              className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 font-medium transition-colors"
            >
              Open the app
            </Link>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
