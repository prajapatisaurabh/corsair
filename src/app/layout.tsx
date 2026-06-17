import type { Metadata } from "next";
import { Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-app-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
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
      className={`${bricolage.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
