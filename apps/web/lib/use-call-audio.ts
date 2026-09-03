"use client";

import { useEffect, useRef, useState } from "react";

export type CallPhase = "idle" | "dialing" | "live" | "ended";

/**
 * Synthetic call audio for the demo consoles: a ringback while dialing, a
 * low telephone-line room tone once connected. Starts muted (browsers block
 * un-gestured sound); the returned `toggle` is wired to a visible control, so
 * the first unmute is a user gesture and playback is allowed. A spoken
 * voiceover track can be layered in here later without touching callers.
 */
export function useCallAudio(phase: CallPhase) {
  const [muted, setMuted] = useState(true);
  const ringRef = useRef<HTMLAudioElement | null>(null);
  const bedRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const ring = new Audio("/media/call-ring.mp3");
    const bed = new Audio("/media/call-ambience.mp3");
    ring.loop = true;
    bed.loop = true;
    ring.volume = 0.42;
    bed.volume = 0.3;
    ring.muted = true;
    bed.muted = true;
    ringRef.current = ring;
    bedRef.current = bed;
    return () => {
      ring.pause();
      bed.pause();
      ringRef.current = null;
      bedRef.current = null;
    };
  }, []);

  useEffect(() => {
    const ring = ringRef.current;
    const bed = bedRef.current;
    if (!ring || !bed) return;

    ring.muted = muted;
    bed.muted = muted;

    if (phase === "dialing") {
      bed.pause();
      ring.play().catch(() => {});
    } else if (phase === "live") {
      ring.pause();
      bed.play().catch(() => {});
    } else {
      ring.pause();
      bed.pause();
    }
  }, [phase, muted]);

  return { muted, toggle: () => setMuted((m) => !m) };
}
