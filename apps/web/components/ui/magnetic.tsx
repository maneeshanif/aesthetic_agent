"use client";

import { useLayoutEffect, useRef } from "react";

/**
 * Pulls its child toward the cursor with GSAP quickTo — no React state,
 * so it stays 60fps on mobile. Falls back to static under reduced motion.
 */
export function Magnetic({
  children,
  strength = 0.35,
  className,
}: {
  children: React.ReactNode;
  strength?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cleanup = () => {};
    let cancelled = false;

    import("gsap").then(({ gsap }) => {
      if (cancelled || !ref.current) return;
      const node = ref.current;
      const xTo = gsap.quickTo(node, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(node, "y", { duration: 0.5, ease: "power3" });

      const onMove = (e: MouseEvent) => {
        const r = node.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      };
      const onLeave = () => {
        xTo(0);
        yTo(0);
      };
      node.addEventListener("mousemove", onMove);
      node.addEventListener("mouseleave", onLeave);
      cleanup = () => {
        node.removeEventListener("mousemove", onMove);
        node.removeEventListener("mouseleave", onLeave);
        gsap.set(node, { x: 0, y: 0 });
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [strength]);

  return (
    <span ref={ref} className={className} style={{ display: "inline-block", willChange: "transform" }}>
      {children}
    </span>
  );
}
