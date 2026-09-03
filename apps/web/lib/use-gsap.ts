"use client";

import { useLayoutEffect, useRef, type DependencyList } from "react";

/**
 * Scoped GSAP animation hook. `setup` runs inside a `gsap.context` bound to the
 * returned ref, so every tween/ScrollTrigger it creates is reverted on cleanup.
 * Respects `prefers-reduced-motion`.
 */
export function useGsap<T extends HTMLElement = HTMLDivElement>(
  setup: (ctx: { gsap: typeof import("gsap").gsap; scope: T }) => void,
  deps: DependencyList = [],
) {
  const scope = useRef<T>(null);

  useLayoutEffect(() => {
    if (typeof window === "undefined" || !scope.current) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    let ctx: { revert: () => void } | undefined;
    let cancelled = false;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled || !scope.current) return;
      gsap.registerPlugin(ScrollTrigger);
      ctx = gsap.context(() => setup({ gsap, scope: scope.current as T }), scope.current);
    })();

    return () => {
      cancelled = true;
      ctx?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return scope;
}
