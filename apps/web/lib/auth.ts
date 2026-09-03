import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

export { ROLE_LABEL, canEditPatients, canManageKnowledge, canManageTeam } from "@/lib/permissions";

export interface Membership {
  spaIds: string[];
  memberships: Record<string, Role>;
}

export interface SessionUser {
  id: string;
  email: string | null;
  accessToken: string;
  membership: Membership;
}

/** Read the authenticated user + tenant claims from the Supabase session. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const appMeta = (session.user.app_metadata ?? {}) as {
    spa_ids?: string[];
    memberships?: Record<string, Role>;
  };

  return {
    id: session.user.id,
    email: session.user.email ?? null,
    accessToken: session.access_token,
    membership: {
      spaIds: appMeta.spa_ids ?? [],
      memberships: appMeta.memberships ?? {},
    },
  };
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}
