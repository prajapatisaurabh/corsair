import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Geist + Geist Mono — Vercel's developer-loved typefaces, clean on screen and
// a natural fit for a keyboard-first tool.
const geistSans = Geist({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-app-mono",
  subsets: ["latin"],
});

const APP_URL = process.env.APP_URL ?? "http://localhost:3456";

const DESCRIPTION =
  'Tempo is a keyboard-first Gmail + Google Calendar client that detects the time hidden in your email — "can we meet Thursday?" becomes a calendar invite with one keystroke. Built on Corsair.';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  // Per-page titles render as "Login · Tempo"; the home page uses the default.
  title: {
    default: "Tempo — email that thinks in time",
    template: "%s · Tempo",
  },
  description: DESCRIPTION,
  applicationName: "Tempo",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Tempo",
    title: "Tempo — email that thinks in time",
    description: DESCRIPTION,
    url: APP_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "Tempo — email that thinks in time",
    description: DESCRIPTION,
  },
  // Google Search Console site verification. Set GOOGLE_SITE_VERIFICATION to the
  // token Google gives you (the `content` value of the meta tag). Emits
  // <meta name="google-site-verification" content="..." /> in <head>.
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
