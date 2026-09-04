"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, PhoneCall } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { Waveform } from "@/components/marketing/waveform";
import { Scene } from "@/components/marketing/scene";
import { MuteToggle } from "@/components/marketing/mute-toggle";
import { useGsap } from "@/lib/use-gsap";
import { useCallAudio } from "@/lib/use-call-audio";
import { cn } from "@/lib/utils";

const CAPTIONS = [
  { at: 700, text: "Hi Delphine — you checked our Morpheus8 pricing last night." },
  { at: 3400, text: "We've had a cancellation tomorrow at 2:00 PM." },
  { at: 6200, text: "Shall I hold that slot under your name?" },
];
const LOOP = 10500;

export function HeroLedger() {
  // Entrance only. Everything is visible in the markup by default and GSAP
  // animates *from* a hidden state — so reduced-motion, no-JS, or a slow
  // chunk load can never leave the hero (or its console) blank.
  const scope = useGsap(({ gsap }) => {
    gsap
      .timeline({ defaults: { ease: "power4.out" } })
      .from("[data-line]", { yPercent: 118, skewY: 4, filter: "blur(10px)", duration: 1.15, stagger: 0.11 }, 0.15)
      .from("[data-sub]", { opacity: 0, y: 12, duration: 0.8 }, "-=0.75")
      .from("[data-cta]", { opacity: 0, y: 12, duration: 0.7 }, "-=0.6")
      .from("[data-console]", { opacity: 0, y: 44, filter: "blur(8px)", duration: 1 }, "-=0.95");
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

  const { muted, toggle } = useCallAudio(
    !running ? "idle" : ended ? "ended" : live ? "live" : "dialing",
  );

  return (
    <section ref={scope} className="relative w-full overflow-hidden">
      <Scene
        src="/media/hero-reception"
        poster="/media/hero-desk.webp"
        className="-z-20 opacity-[0.32] [mask-image:linear-gradient(90deg,black,black_28%,transparent_64%)]"
        objectPosition="72% 42%"
        dim={0.86}
        priority
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_60%_at_78%_50%,rgba(11,10,13,0.75),transparent),linear-gradient(to_bottom,rgba(11,10,13,0.7),rgba(11,10,13,0.35)_40%,var(--surface-0))]"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -right-52 top-0 h-[44rem] w-[44rem] rounded-full bg-champagne/[0.13] blur-[140px] motion-safe:animate-gold-drift"
      />

      <div className="container grid grid-cols-1 items-center gap-y-16 pb-28 pt-40 lg:grid-cols-12 lg:gap-x-10 lg:pb-40 lg:pt-48">
        <div className="lg:col-span-6">
          <p className="mb-6 inline-flex items-center gap-2 rounded-pill border border-stroke bg-pearl/60 px-3 py-1 text-[0.72rem] font-medium uppercase tracking-[0.14em] text-champagne backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-champagne" />
            For medical spas &amp; aesthetic clinics
          </p>
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

          <p data-sub className="mt-9 max-w-lg text-lg leading-relaxed text-slate">
            Vespera answers the 11&nbsp;PM DM in seconds, picks up the clinic line after hours, and
            calls stalled leads back the same evening — checking your clinical rulebook before it ever
            says <span className="text-espresso">yes</span>.
          </p>

          <div data-cta className="mt-10 flex flex-wrap items-center gap-3">
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
          <div ref={consoleRef} data-console className="panel-lit p-5 sm:p-6">
            {/* The person on the other end of the line. */}
            <div className="relative -mx-5 -mt-5 mb-4 h-24 overflow-hidden rounded-t-[13px] sm:-mx-6 sm:-mt-6 sm:h-28">
              <Scene
                src="/media/voice-outbound"
                poster="/media/voice-waveform.webp"
                objectPosition="50% 30%"
                dim={0.28}
                grade={false}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-pearl via-pearl/25 to-transparent" />
              <div className="absolute inset-x-4 bottom-2 flex items-center justify-between">
                <span className="flex items-center gap-2 font-mono text-[0.68rem] uppercase tracking-wide text-strong">
                  <span className="h-1.5 w-1.5 rounded-full bg-coral motion-safe:animate-pulse" />
                  Delphine · mobile
                </span>
                <MuteToggle muted={muted} onToggle={toggle} />
              </div>
            </div>

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
