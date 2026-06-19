"use client";

import { useState } from "react";
import Link from "next/link";
import { Brand } from "@/components/Brand";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const connectGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/connect", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        // Corsair connect link → Google consent screen
        window.location.href = data.url;
        return;
      }
      setError(data.error ?? "Google sign-in isn't configured yet.");
    } catch {
      setError("Could not reach the server.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0b0a12] text-zinc-100 flex flex-col">
      <header className="max-w-5xl w-full mx-auto flex items-center px-6 h-16">
        <Brand />
      </header>

      <main className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border border-white/10 bg-white/3 p-8">
            <h1 className="text-xl font-semibold text-center">
              Welcome to Tempo
            </h1>
            <p className="mt-2 text-sm text-zinc-400 text-center">
              One sign-in connects Gmail <i>and</i> Google Calendar —<br />
              OAuth handled end-to-end by Corsair.
            </p>

            <button
              onClick={connectGoogle}
              disabled={loading}
              className="mt-7 w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white text-black font-medium hover:bg-zinc-200 disabled:opacity-60"
            >
              <GoogleIcon />
              {loading ? "Opening Google…" : "Continue with Google"}
            </button>

            {error && (
              <div className="mt-4 text-[14px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2.5">
                {error}
              </div>
            )}
          </div>

          <p className="mt-5 text-center text-[13.5px] text-zinc-600 leading-relaxed">
            Your Google tokens are envelope-encrypted and stored by Corsair in
            Postgres — they never touch the browser or the agent.
          </p>

          <p className="mt-4 text-center text-[13px] text-zinc-600">
            By continuing you agree to our{" "}
            <Link href="/terms" className="underline hover:text-zinc-400">
              Terms
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="underline hover:text-zinc-400">
              Privacy Policy
            </Link>
            .
          </p>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"
      />
      <path
        fill="#FF3D00"
        d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C36.9 39.2 44 34 44 24c0-1.3-.1-2.6-.4-3.9z"
      />
    </svg>
  );
}
