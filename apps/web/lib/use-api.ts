"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { ApiClientError } from "@/lib/api-client";
import { createApi, type Api } from "@/lib/api";
import { useAppStore } from "@/store/app-store";

/** API surface bound to the current session token + active workspace. */
export function useApi(): Api {
  const { token } = useSession();
  const spaId = useAppStore((s) => s.activeSpaId);
  return useMemo(() => createApi(token, spaId), [token, spaId]);
}

interface ResourceState<T> {
  data: T | null;
  error: ApiClientError | Error | null;
  loading: boolean;
}

/** Minimal data-fetching hook — load on mount, expose refetch. */
export function useResource<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<ResourceState<T>>({
    data: null,
    error: null,
    loading: enabled,
  });
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      setState({ data, error: null, loading: false });
    } catch (err) {
      setState({ data: null, error: err as Error, loading: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!enabled) {
      setState({ data: null, error: null, loading: false });
      return;
    }
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  return { ...state, refetch: run, setData: (d: T) => setState((s) => ({ ...s, data: d })) };
}
