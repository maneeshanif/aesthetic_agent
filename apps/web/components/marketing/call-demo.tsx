"use client";

import { useEffect, useRef, useState } from "react";
import { Check, MessageSquareText, PhoneCall, PhoneIncoming } from "lucide-react";
import { Waveform } from "@/components/marketing/waveform";
import { cn } from "@/lib/utils";

type Mode = "outbound" | "inbound";

interface Line {
  at: number;
  who: "vespera" | "caller";
  text: string;
}

interface Scene {
  header: string;
  sub: string;
  connectLabel: string;
  connectAt: number;
  lines: Line[];
  outcome: { title: string; meta: string; sideNote: string };
  total: number;
}

const SCENES: Record<Mode, Scene> = {
  outbound: {
    header: "Vespera → Delphine Aumont",
    sub: "Abandoned lead · checked Morpheus8 pricing 2h ago",
    connectLabel: "Connected",
    connectAt: 2200,
    lines: [
      { at: 2600, who: "vespera", text: "Hi Delphine, this is Dr. Marchetti's concierge at Vespera." },
      { at: 5000, who: "vespera", text: "You looked at our Morpheus8 pricing last night but didn't finish booking." },
      { at: 7600, who: "caller", text: "Oh — yes. I got pulled away." },
      { at: 9200, who: "vespera", text: "We've had a cancellation tomorrow at 2:00 PM. Shall I hold it under your name?" },
      { at: 11800, who: "caller", text: "Please do." },
    ],
    outcome: { title: "Booked · Morpheus8 full face", meta: "Tomorrow, 2:00 PM", sideNote: "Confirmation SMS sent" },
    total: 14000,
  },
  inbound: {
    header: "+1 (305) 555-0148 → Vespera",
    sub: "After-hours call to the clinic line · 11:24 PM",
    connectLabel: "Answered",
    connectAt: 1700,
    lines: [
      { at: 2100, who: "vespera", text: "Sterling Aesthetics — this is Vespera, the front-desk concierge." },
      { at: 4400, who: "caller", text: "Do you do lip filler? And are you open Saturday?" },
      { at: 7000, who: "vespera", text: "We do — 1ml is $650, and Saturdays run 10 to 4. I have 11:00 AM open." },
      { at: 10000, who: "caller", text: "Perfect, book me in." },
      { at: 11600, who: "vespera", text: "Done. I'll text the address and parking now." },
    ],
    outcome: { title: "Booked · Lip filler · 1ml", meta: "Saturday, 11:00 AM", sideNote: "Directions texted" },
    total: 13400,
  },
};

const TICKS = [
  "Answers from your own menu and safety rules",
  "Handles pricing, availability, contraindications",
  "Books, or texts the scheduling link, then logs it",
];

export function CallDemo() {
  const [mode, setMode] = useState<Mode>("outbound");
  const [locked, setLocked] = useState(false);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const scene = SCENES[mode];
  const cycle = scene.total + 2800;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(scene.total);
      return;
    }
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, [scene.total]);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let start = performance.now();
    const loop = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= cycle) {
        start = now;
        if (!locked) setMode((m) => (m === "outbound" ? "inbound" : "outbound"));
        setT(0);
      } else {
        setT(elapsed);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, locked, cycle]);

  useEffect(() => {
    const el = transcriptRef.current;
    el?.scrollTo?.({ top: el.scrollHeight, behavior: "smooth" });
  }, [t]);

  const connected = t >= scene.connectAt;
  const ended = t >= scene.total;
  const live = connected && !ended;
  const secs = Math.max(0, Math.floor((Math.min(t, scene.total) - scene.connectAt) / 1000));
  const visible = scene.lines.filter((l) => t >= l.at);
  const status = ended
    ? "Call ended"
    : connected
      ? `${scene.connectLabel} 0:${String(secs).padStart(2, "0")}`
      : mode === "outbound"
        ? "Dialing…"
        : "Ringing…";

  function pick(m: Mode) {
    setLocked(true);
    setMode(m);
    setT(0);
  }

  return (
    <section id="voice" className="mesh section border-y border-hairline">
      <div className="container grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <h2 className="text-display-2 text-espresso">
            It picks up the phone. <span className="text-grad">Inbound and outbound.</span>
          </h2>
          <p className="mt-4 max-w-md text-[0.98rem] leading-relaxed text-slate">
            After hours it answers the clinic line like a trained receptionist, and calls stalled
            leads back the same evening — referencing the earlier chat, booking before the call ends.
          </p>

          <div
            role="tablist"
            aria-label="Call type"
            className="mt-8 inline-flex rounded-pill border border-stroke bg-pearl p-1"
          >
            {(["outbound", "inbound"] as Mode[]).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => pick(m)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-pill px-4 py-2 text-sm transition-[background,color] duration-200 active:scale-[0.97]",
                  mode === m ? "bg-grad text-[var(--text-on-accent)]" : "text-slate hover:text-espresso",
                )}
                style={{ transitionTimingFunction: "var(--ease-out)" }}
              >
                {m === "outbound" ? (
                  <PhoneCall className="h-3.5 w-3.5" strokeWidth={2} />
                ) : (
                  <PhoneIncoming className="h-3.5 w-3.5" strokeWidth={2} />
                )}
                {m === "outbound" ? "Outbound recovery" : "Inbound reception"}
              </button>
            ))}
          </div>

          <ul className="mt-8 space-y-2.5">
            {TICKS.map((tick) => (
              <li key={tick} className="flex items-start gap-2.5 text-sm text-slate">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-coral" strokeWidth={2} />
                {tick}
              </li>
            ))}
          </ul>
        </div>

        {/* Call console */}
        <div ref={ref} className="panel-lit p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-grad text-[var(--text-on-accent)]">
                {mode === "outbound" ? (
                  <PhoneCall className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <PhoneIncoming className="h-4 w-4" strokeWidth={2} />
                )}
              </span>
              <div className="leading-tight">
                <p className="text-sm font-medium text-espresso">{scene.header}</p>
                <p className="text-xs text-faint">{scene.sub}</p>
              </div>
            </div>
            <span
              className={cn(
                "flex items-center gap-1.5 font-mono text-xs",
                live ? "text-sage" : ended ? "text-faint" : "text-coral",
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  live
                    ? "bg-sage motion-safe:animate-pulse"
                    : ended
                      ? "bg-faint"
                      : "bg-coral motion-safe:animate-pulse",
                )}
              />
              {status}
            </span>
          </div>

          {/* Waveform with pre-connect rings */}
          <div className="relative mt-6 flex h-[132px] items-center justify-center">
            {!connected && (
              <span
                aria-hidden
                className="absolute h-24 w-24 rounded-full border border-coral/40 motion-safe:animate-pulse-ring"
              />
            )}
            <Waveform live={live} height={132} bars={72} className="w-full" />
          </div>

          {/* Transcript */}
          <div
            ref={transcriptRef}
            className="mt-5 h-[7.5rem] space-y-2 overflow-y-auto rounded-lg border border-hairline bg-ink px-4 py-3"
          >
            {visible.length === 0 ? (
              <p className="text-[0.82rem] text-faint">Transcript builds here as the call runs…</p>
            ) : (
              visible.map((l, i) => (
                <p
                  key={i}
                  className={cn(
                    "text-[0.84rem] leading-snug motion-safe:[animation:dm-in_.4s_var(--ease-out)_both]",
                    l.who === "vespera" ? "text-strong" : "text-slate",
                  )}
                >
                  <span className={cn("font-medium", l.who === "vespera" ? "text-champagne" : "text-faint")}>
                    {l.who === "vespera" ? "Vespera" : "Caller"}
                  </span>{" "}
                  {l.text}
                </p>
              ))
            )}
          </div>

          <div
            className={cn(
              "mt-4 grid gap-3 transition-[transform,opacity,filter] duration-500 sm:grid-cols-[1fr_auto]",
              ended ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-2 opacity-0 blur-[3px]",
            )}
            style={{ transitionTimingFunction: "var(--ease-drawer)" }}
          >
            <div className="glow-grad flex items-center gap-3 rounded-lg bg-elevated px-4 py-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-grad text-[var(--text-on-accent)]">
                <Check className="h-4 w-4" strokeWidth={2.5} />
              </span>
              <span className="leading-tight">
                <span className="block text-sm font-medium text-espresso">{scene.outcome.title}</span>
                <span className="block text-xs text-faint">{scene.outcome.meta}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-hairline bg-ink px-4 py-3 text-xs text-slate">
              <MessageSquareText className="h-3.5 w-3.5 text-coral" strokeWidth={1.75} />
              {scene.outcome.sideNote}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
