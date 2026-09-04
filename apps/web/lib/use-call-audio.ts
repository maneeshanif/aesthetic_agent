"use client";

import { useEffect, useRef, useState } from "react";

export type CallPhase = "idle" | "dialing" | "live" | "ended";

/**
 * The browser blocks un-gestured sound, so we watch for the visitor's first
 * real interaction anywhere on the page (pointer, key, touch) and "arm" audio
 * once. Shared module-level state so every console reacts to that one gesture.
 * (Wheel/scroll is deliberately excluded — it doesn't grant audio permission.)
 */
let armed = false;
const armListeners = new Set<() => void>();
let installed = false;

function installArmOnce() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  const arm = () => {
    if (armed) return;
    armed = true;
    armListeners.forEach((fn) => fn());
    remove();
  };
  const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "touchstart"];
  const remove = () => events.forEach((e) => window.removeEventListener(e, arm));
  events.forEach((e) => window.addEventListener(e, arm, { once: false, passive: true }));
}

/**
 * Synthetic call audio for the demo consoles: a ringback while dialing, a
 * low telephone-line room tone once connected. Muted until the visitor's
 * first interaction, then it comes on by itself; the returned `toggle` still
 * lets them silence it. A spoken voiceover track can layer in here later.
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

  // Arm on the first page interaction, then un-mute this console once.
  useEffect(() => {
    if (armed) {
      setMuted(false);
      return;
    }
    installArmOnce();
    const onArm = () => setMuted(false);
    armListeners.add(onArm);
    return () => {
      armListeners.delete(onArm);
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
