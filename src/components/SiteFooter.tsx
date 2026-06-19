import Link from "next/link";

const LINKS = [
  { href: "/shortcuts", label: "Shortcuts" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/8 mt-auto">
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[14px] text-zinc-500">
        <div className="flex items-center gap-2">
          <span className="font-mono text-zinc-400">tempo</span>
          <span className="text-zinc-700">·</span>
          <span>built on Corsair, with ♥ for keyboards</span>
        </div>
        <nav className="flex items-center gap-5">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-zinc-200 transition-colors">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
