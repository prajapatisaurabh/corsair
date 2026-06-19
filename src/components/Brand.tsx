import Link from "next/link";

/** The Tempo wordmark + glyph, used in headers across the marketing pages. */
export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div className="w-7 h-7 rounded-md bg-linear-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-violet-500/20">
        T
      </div>
      <span className="font-semibold tracking-tight text-lg">Tempo</span>
    </Link>
  );
}
