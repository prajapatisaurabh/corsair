"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/**
 * Auth-aware header button for the static landing page. The page itself is
 * prerendered (no per-request session read), so this client island checks
 * /api/auth/me after mount and swaps "Sign in" → "Open Tempo" once it learns
 * the visitor is already connected. Defaults to "Sign in" so the prerendered
 * markup matches and there's no layout shift for signed-out visitors.
 */
export function HeaderCta() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (active) setConnected(Boolean(d?.connected));
      })
      .catch(() => {
        /* stay on the signed-out CTA */
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <Link
      href={connected ? "/app" : "/login"}
      className="px-4 py-1.5 rounded-lg bg-white text-black font-medium hover:bg-zinc-200 transition-colors"
    >
      {connected ? "Open Tempo →" : "Sign in"}
    </Link>
  );
}
