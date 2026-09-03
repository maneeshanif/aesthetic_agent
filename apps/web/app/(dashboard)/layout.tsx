import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SessionProvider } from "@/components/providers/session-provider";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  if (user.membership.spaIds.length === 0) redirect("/register");

  return (
    <SessionProvider
      initialToken={user.accessToken}
      initialUserId={user.id}
      initialEmail={user.email}
    >
      <DashboardShell
        email={user.email}
        spaIds={user.membership.spaIds}
        memberships={user.membership.memberships}
      >
        {children}
      </DashboardShell>
    </SessionProvider>
  );
}
