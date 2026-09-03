"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { Waveform } from "@/components/marketing/waveform";
import { Scene } from "@/components/marketing/scene";
import { useGsap } from "@/lib/use-gsap";
import { cn } from "@/lib/utils";

const CAPTIONS = [
  { at: 700, text: "Hi Delphine — you checked our Morpheus8 pricing last night." },
  { at: 3400, text: "We've had a cancellation tomorrow at 2:00 PM." },
  { at: 6200, text: "Shall I hold that slot under your name?" },
];
const LOOP = 10500;

export function HeroLedger() {
  const scope = useGsap(({ gsap }) => {
    gsap.set("[data-line]", { yPercent: 118, skewY: 4, filter: "blur(10px)" });
    gsap
      .timeline({ defaults: { ease: "power4.out" } })
      .to("[data-line]", { yPercent: 0, skewY: 0, filter: "blur(0px)", duration: 1.15, stagger: 0.11 }, 0.15)
      .to("[data-sub]", { opacity: 1, y: 0, duration: 0.8 }, "-=0.75")
      .to("[data-cta]", { opacity: 1, y: 0, duration: 0.7 }, "-=0.6")
      .fromTo("[data-console]", { opacity: 0, y: 44, filter: "blur(8px)" }, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1 }, "-=0.95");
  });

  const consoleRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const el = consoleRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setT(LOOP);
      return;
    }
    const io = new IntersectionObserver(([e]) => setRunning(e.isIntersecting), { threshold: 0.3 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => {
      setT((now - start) % LOOP);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const connected = t >= 400;
  const ended = t >= 8200;
  const live = connected && !ended;
  const secs = Math.max(0, Math.floor((Math.min(t, 8200) - 400) / 1000));
  const caption = [...CAPTIONS].reverse().find((c) => t >= c.at)?.text ?? CAPTIONS[0].text;

  return (
    <section ref={scope} className="relative w-full overflow-hidden">
      <Scene
        src="/media/hero-reception"
        poster="/media/hero-desk.webp"
        className="-z-20 opacity-[0.55]"
        objectPosition="70% 40%"
        dim={0.72}
        priority
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-canvas/60 via-canvas/30 to-canvas"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-52 top-0 h-[44rem] w-[44rem] rounded-full bg-champagne/[0.13] blur-[140px] motion-safe:animate-gold-drift"
      />

      <div className="container grid grid-cols-1 items-center gap-y-16 pb-28 pt-40 lg:grid-cols-12 lg:gap-x-10 lg:pb-40 lg:pt-48">
        <div className="lg:col-span-6">
          <h1
            className="font-semibold text-espresso"
            style={{ fontSize: "clamp(2.7rem, 5.7vw, 5.05rem)", lineHeight: 1, letterSpacing: "-0.04em" }}
          >
            <span className="block overflow-hidden pb-1">
              <span data-line className="block">
                The voice on the line
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span data-line className="block">
                when your front desk
              </span>
            </span>
            <span className="block overflow-hidden pb-1">
              <span data-line className="block text-grad">
                has gone home.
              </span>
            </span>
          </h1>

          <p data-sub className="mt-9 max-w-lg translate-y-3 text-lg leading-relaxed text-slate opacity-0">
            Vespera answers the 11&nbsp;PM DM in seconds, picks up the clinic line after hours, and
            calls stalled leads back the same evening — checking your clinical rulebook before it ever
            says <span className="text-espresso">yes</span>.
          </p>

          <div data-cta className="mt-10 flex translate-y-3 flex-wrap items-center gap-3 opacity-0">
            <Magnetic strength={0.4}>
              <Button asChild size="lg" variant="primary">
                <Link href="/register">
                  Request access
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="outline">
              <a href="#voice">Hear a live call</a>
            </Button>
          </div>
        </div>

        {/* Live voice console */}
        <div className="lg:col-span-6">
          <div ref={consoleRef} data-console className="panel-lit p-5 opacity-0 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-grad text-[var(--text-on-accent)]">
                  <PhoneCall className="h-4 w-4" strokeWidth={2} />
                </span>
                <div className="leading-tight">
                  <p className="text-sm font-medium text-espresso">Vespera → Delphine Aumont</p>
                  <p className="text-xs text-faint">Outbound recovery · abandoned 2h ago</p>
                </div>
              </div>
              <span className={cn("flex items-center gap-1.5 font-mono text-xs", live ? "text-sage" : ended ? "text-faint" : "text-coral")}>
                <span className={cn("h-1.5 w-1.5 rounded-full", live ? "bg-sage motion-safe:animate-pulse" : ended ? "bg-faint" : "bg-coral motion-safe:animate-pulse")} />
                {ended ? "Call ended" : live ? `Connected 0:${String(secs).padStart(2, "0")}` : "Dialing…"}
              </span>
            </div>

            <div className="mt-5">
              <Waveform live={live} height={92} bars={56} />
            </div>

            <div className="mt-4 min-h-[3rem] rounded-lg border border-hairline bg-ink px-4 py-3 text-[0.85rem] leading-snug text-strong">
              <span key={caption} className="motion-safe:[animation:dm-in_.4s_var(--ease-out)_both]">
                {caption}
              </span>
            </div>

            <div
              className={cn(
                "mt-3 flex items-center gap-3 transition-[transform,opacity,filter] duration-500",
                ended ? "translate-y-0 opacity-100 blur-0" : "pointer-events-none translate-y-2 opacity-0 blur-[3px]",
              )}
              style={{ transitionTimingFunction: "var(--ease-drawer)" }}
            >
              <div className="glow-grad flex flex-1 items-center gap-3 rounded-lg bg-elevated px-3.5 py-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-grad text-[var(--text-on-accent)]">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <span className="leading-tight">
                  <span className="block text-[0.82rem] font-medium text-espresso">Booked · Morpheus8 full face</span>
                  <span className="block text-[0.68rem] text-faint">Tomorrow 2:00 PM · confirmation SMS sent</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
