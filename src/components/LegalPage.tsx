import Link from "next/link";

export function LegalPage({
  title,
  effective,
  children,
}: {
  title: string;
  effective: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0b0a12] text-zinc-100">
      <header className="max-w-3xl mx-auto flex items-center px-6 h-16">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white">
            T
          </div>
          <span className="font-semibold tracking-tight text-lg">Tempo</span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 pt-10 pb-24">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">Effective {effective}</p>

        <div className="mt-8 space-y-8 text-[15px] leading-relaxed text-zinc-300 [&_a]:text-violet-400 [&_a:hover]:text-violet-300 [&_a]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_strong]:text-zinc-100">
          {children}
        </div>
      </main>

      <footer className="border-t border-white/8 py-6 text-center text-[14px] text-zinc-600">
        <Link href="/" className="hover:text-zinc-400">
          Tempo
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="hover:text-zinc-400">
          Privacy
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="hover:text-zinc-400">
          Terms
        </Link>
      </footer>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
      {children}
    </section>
  );
}
