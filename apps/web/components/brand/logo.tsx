"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Vespera mark — the animated evening-star seal, with a still fallback. */
export function VesperaMark({ className }: { className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    setMotion(!window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (motion) videoRef.current?.play().catch(() => {});
  }, [motion]);

  return (
    <span
      className={cn(
        "relative block h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-stroke",
        className,
      )}
      aria-hidden="true"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/media/logo-star.webp"
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />
      {motion && (
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          src="/media/logo-star.mp4"
          muted
          loop
          playsInline
          preload="auto"
        />
      )}
    </span>
  );
}

export function VesperaWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <VesperaMark />
      <span className="font-display text-[1.35rem] font-semibold leading-none tracking-editorial text-espresso">
        Vespera
      </span>
    </span>
  );
}
