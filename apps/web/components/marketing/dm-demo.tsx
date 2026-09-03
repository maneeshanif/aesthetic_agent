"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Instagram, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Bubble =
  | { kind: "in" | "out"; text: string; at: number }
  | { kind: "typing"; at: number }
  | { kind: "chip"; at: number };

type Trace = { text: string; tone: "read" | "flag" | "ok"; at: number };

const SCRIPT: Bubble[] = [
  { kind: "in", text: "hey do you do morpheus8? how much for full face 👀", at: 400 },
  { kind: "typing", at: 1500 },
  { kind: "out", text: "We do. Morpheus8 full face is $1,200 for your first session, $950 after.", at: 2600 },
  { kind: "in", text: "perfect. i had lip filler like 10 days ago, still ok?", at: 4200 },
  { kind: "typing", at: 5400 },
  { kind: "out", text: "Let's give that filler a full two weeks to settle first — safer for both. I can hold you for the 24th.", at: 6600 },
  { kind: "chip", at: 7600 },
];

const TRACES: Trace[] = [
  { text: "retrieve  pricing_menu.pdf   0.94", tone: "read", at: 1800 },
  { text: "retrieve  morpheus8.md       0.88", tone: "read", at: 2100 },
  { text: "flag      recent_filler <2wk  CAUTION", tone: "flag", at: 5600 },
  { text: "reroute   book → +14 days", tone: "read", at: 6000 },
  { text: "status    booking_offered", tone: "ok", at: 7400 },
];

const TOTAL = 10000;

export function DmDemo() {
  const ref = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setT(TOTAL);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => setRunning(e.isIntersecting),
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let start = performance.now() - t;
    const loop = (now: number) => {
      const elapsed = (now - start) % (TOTAL + 1800);
      setT(elapsed);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  const visibleBubbles = SCRIPT.filter((b) => t >= b.at);
  const showChip = t >= SCRIPT.find((b) => b.kind === "chip")!.at;
  const visibleTraces = TRACES.filter((tr) => t >= tr.at);

  return (
    <section className="section border-t border-hairline">
      <div className="container">
        <div className="max-w-2xl">
          <h2 className="text-display-2 text-espresso">
            The DM that would&apos;ve gone unread — <span className="text-grad">answered in 4 seconds.</span>
          </h2>
          <p className="mt-4 max-w-lg text-[0.98rem] leading-relaxed text-slate">
            A real inbound conversation, played back. Vespera prices from your menu, catches the
            recent-filler flag on its own, and offers a safe slot — no staff awake.
          </p>
        </div>

        <div ref={ref} className="mt-14 grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          {/* Phone */}
          <div className="mx-auto w-full max-w-[22rem] rounded-[2.2rem] border border-stroke bg-ink p-2.5 shadow-overlay">
            <div className="overflow-hidden rounded-[1.8rem] bg-pearl">
              <div className="flex items-center gap-2.5 border-b border-hairline px-4 py-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-grad text-[var(--text-on-accent)]">
                  <Instagram className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                <div className="leading-tight">
                  <p className="text-[0.82rem] font-medium text-espresso">yourstudio</p>
                  <p className="text-[0.68rem] text-faint">Active now</p>
                </div>
              </div>

              <div className="flex h-[24rem] flex-col justify-end gap-2 p-4">
                {visibleBubbles.map((b, i) => {
                  if (b.kind === "chip") return null;
                  if (b.kind === "typing") {
                    const next = SCRIPT[SCRIPT.indexOf(b) + 1];
                    if (next && t >= next.at) return null;
                    return <Typing key={i} />;
                  }
                  return (
                    <div
                      key={i}
                      className={cn(
                        "max-w-[82%] rounded-2xl px-3.5 py-2 text-[0.85rem] leading-snug",
                        "motion-safe:[animation:dm-in_.4s_var(--ease-out)_both]",
                        b.kind === "in"
                          ? "self-start rounded-bl-md border border-stroke bg-elevated text-espresso"
                          : "self-end rounded-br-md bg-grad text-[var(--text-on-accent)]",
                      )}
                    >
                      {b.text}
                    </div>
                  );
                })}

                <div
                  className={cn(
                    "self-end transition-[transform,opacity,filter] duration-500",
                    showChip
                      ? "translate-y-0 opacity-100 blur-0"
                      : "pointer-events-none translate-y-2 opacity-0 blur-[3px]",
                  )}
                  style={{ transitionTimingFunction: "var(--ease-drawer)" }}
                >
                  <div className="glow-grad flex items-center gap-2.5 rounded-xl bg-elevated px-3.5 py-2.5">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-grad text-[var(--text-on-accent)]">
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </span>
                    <span className="leading-tight">
                      <span className="block text-[0.8rem] font-medium text-espresso">
                        Hold · Thu the 24th, 2:00 PM
                      </span>
                      <span className="block text-[0.68rem] text-faint">Morpheus8 full face · booking link sent</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Reasoning rail */}
          <div className="rounded-card border border-stroke bg-pearl p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-coral" strokeWidth={1.75} />
              <p className="text-xs font-medium text-espresso">Reasoning trace</p>
            </div>
            <div className="mt-4 space-y-1.5 font-mono text-[0.74rem]">
              {visibleTraces.length === 0 ? (
                <p className="text-faint">waiting for first message…</p>
              ) : (
                visibleTraces.map((tr, i) => (
                  <p
                    key={i}
                    className={cn(
                      "motion-safe:[animation:dm-in_.35s_var(--ease-out)_both]",
                      tr.tone === "flag" && "text-coral",
                      tr.tone === "ok" && "text-sage",
                      tr.tone === "read" && "text-slate",
                    )}
                  >
                    {tr.text}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Typing() {
  return (
    <div className="self-start rounded-2xl rounded-bl-md border border-stroke bg-elevated px-3.5 py-2.5">
      <span className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-faint motion-safe:animate-bounce"
            style={{ animationDelay: `${i * 120}ms`, animationDuration: "1s" }}
          />
        ))}
      </span>
    </div>
  );
}
