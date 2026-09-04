"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cinematic media layer for the landing page.
 *
 * Renders a looping, muted, in-view-only <video> with an amber colour grade and
 * film grain baked on in CSS so generated footage blends into the dark palette.
 * Falls back to the poster still for `prefers-reduced-motion` and while the
 * video buffers. Optionally scrubs playback to the section's scroll progress.
 */
export interface SceneProps {
  /** Path under /public, without extension — e.g. "/media/hero-reception". Omit for a still-only layer. */
  src?: string;
  /** Poster / reduced-motion still, with extension — e.g. "/media/hero-desk.webp". */
  poster: string;
  className?: string;
  /** CSS object-position for the video/still. */
  objectPosition?: string;
  /** 0–1 — how hard to darken the footage for text legibility. Default 0.55. */
  dim?: number;
  /** Drive currentTime from scroll instead of autoplaying a loop. */
  scrub?: boolean;
  /** Start loading immediately (above-the-fold). */
  priority?: boolean;
  /** Amber grade + grain. Default true. */
  grade?: boolean;
  children?: React.ReactNode;
}

export function Scene({
  src,
  poster,
  className,
  objectPosition = "center",
  dim = 0.55,
  scrub = false,
  priority = false,
  grade = true,
  children,
}: SceneProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  // Play only while on screen; pause otherwise to spare the main thread.
  useEffect(() => {
    if (reduced || scrub || !src) return;
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, scrub, src]);

  // Scroll-scrubbed playback: map the wrapper's progress through the viewport
  // onto the clip's duration.
  useEffect(() => {
    if (reduced || !scrub || !src) return;
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight || 1;
        const p = Math.min(1, Math.max(0, (vh - rect.top) / (vh + rect.height)));
        if (video.duration) video.currentTime = p * video.duration;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [reduced, scrub, src]);

  return (
    <div
      ref={wrapRef}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {/* Poster — always painted; the video fades in over it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={poster}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        style={{ objectPosition }}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
      />

      {!reduced && src && (
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 h-full w-full object-cover transition-opacity duration-700",
            ready ? "opacity-100" : "opacity-0",
          )}
          style={{ objectPosition }}
          muted
          loop={!scrub}
          playsInline
          preload={priority ? "auto" : "metadata"}
          autoPlay={!scrub && priority}
          onLoadedData={() => setReady(true)}
          onCanPlay={() => setReady(true)}
        >
          <source src={`${src}.mp4`} type="video/mp4" />
        </video>
      )}

      {grade && (
        <>
          {/* Amber → coral wash to marry footage to the accent arc. */}
          <div
            className="absolute inset-0 mix-blend-color"
            style={{ background: "var(--grad)", opacity: 0.22 }}
          />
          {/* Warm-black floor so white type always holds. */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 70% 20%, transparent 0%, rgba(11,10,13,0.35) 55%, rgba(8,7,9,0.92) 100%)",
              opacity: dim,
            }}
          />
          <div className="scene-grain absolute inset-0" />
        </>
      )}

      {children}
    </div>
  );
}
