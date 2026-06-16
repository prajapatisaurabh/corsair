import { redirect } from "next/navigation";
import { isConnected } from "@/server/corsair";
import { getUserId } from "@/server/session";

/**
 * Server-side auth guard for the /app segment. Runs on every request (reads
 * the session cookie → dynamic). If the visitor isn't a connected user, they
 * never reach the client app — they're sent to /login.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const connected = await isConnected(await getUserId());
  if (!connected) redirect("/login");
  return <>{children}</>;
}
