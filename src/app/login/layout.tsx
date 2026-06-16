import { redirect } from "next/navigation";
import { isConnected } from "@/server/corsair";
import { getUserId } from "@/server/session";

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
