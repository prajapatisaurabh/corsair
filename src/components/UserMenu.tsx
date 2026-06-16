"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

type UserData = { connected: boolean; email: string | null; picture: string | null };

export function UserMenu() {
  const [data, setData] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: UserData) => { if (d.connected) setData(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (!data) return null;

  const initial = data.email ? data.email[0].toUpperCase() : "G";

  const Avatar = ({ size }: { size: number }) => (
    data.picture ? (
      <Image src={data.picture} alt={data.email ?? "User"} width={size} height={size} className="object-cover w-full h-full" />
    ) : (
      <span className="w-full h-full flex items-center justify-center bg-violet-600 font-semibold text-white" style={{ fontSize: size * 0.43 }}>
        {initial}
      </span>
    )
  );

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/10 hover:ring-violet-500/60 transition-all focus:outline-none"
        aria-label="User menu"
      >
        <Avatar size={28} />
      </button>

      {open && (
        <div className="absolute right-0 top-9 w-56 rounded-xl border border-white/10 bg-[#1a1825] shadow-xl z-50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
              <Avatar size={32} />
            </div>
            <span className="text-[13px] text-zinc-300 truncate">
              {data.email ?? "Connected"}
            </span>
          </div>

          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full text-left px-4 py-2.5 text-[13px] text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
