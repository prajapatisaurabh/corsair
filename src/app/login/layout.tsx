import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { isConnected } from "@/server/corsair";
import { getUserId } from "@/server/session";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Connect your Google account to Tempo. One consent flow links Gmail and Google Calendar — tokens are encrypted by Corsair.",
  alternates: { canonical: "/login" },
};

/**
 * If an already-connected user lands on /login, send them straight to the app
 * — a signed-in user shouldn't see the login page.
 */
export default async function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const connected = await isConnected(await getUserId());
  if (connected) redirect("/app");
  return <>{children}</>;
}
