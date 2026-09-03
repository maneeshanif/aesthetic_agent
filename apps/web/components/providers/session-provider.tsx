"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SessionValue {
  token: string | null;
  userId: string | null;
  email: string | null;
  ready: boolean;
}

const SessionContext = createContext<SessionValue>({
  token: null,
  userId: null,
  email: null,
  ready: false,
});

export function SessionProvider({
  children,
  initialToken = null,
  initialUserId = null,
  initialEmail = null,
}: {
  children: React.ReactNode;
  initialToken?: string | null;
  initialUserId?: string | null;
  initialEmail?: string | null;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState<SessionValue>({
    token: initialToken,
    userId: initialUserId,
    email: initialEmail,
    ready: Boolean(initialToken),
  });

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setValue({
        token: data.session?.access_token ?? null,
        userId: data.session?.user?.id ?? null,
        email: data.session?.user?.email ?? null,
        ready: true,
      });
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setValue({
        token: session?.access_token ?? null,
        userId: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        ready: true,
      });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
