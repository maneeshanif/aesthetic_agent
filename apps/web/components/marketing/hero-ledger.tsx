"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useGsap } from "@/lib/use-gsap";
import { cn } from "@/lib/utils";

interface LedgerRow {
  name: string;
  city: string;
  treatment: string;
  value: number;
  time: string;
}

const SEED: LedgerRow[] = [
  { name: "Sarah T.", city: "Dallas, TX", treatment: "Morpheus8 Full Face", value: 1250, time: "11:42 PM" },
  { name: "Elena R.", city: "Miami, FL", treatment: "Profhilo + Filler", value: 950, time: "11:08 PM" },
  { name: "Priya N.", city: "London, UK", treatment: "Erbium Resurfacing", value: 1400, time: "10:51 PM" },
  { name: "Jade W.", city: "Beverly Hills", treatment: "Lip Filler Refresh", value: 780, time: "10:29 PM" },
  { name: "Amira K.", city: "Dubai, AE", treatment: "Full-Face PRP", value: 1120, time: "10:03 PM" },
];

const POOL: LedgerRow[] = [
  { name: "Nadia F.", city: "Austin, TX", treatment: "Sculptra (2 vials)", value: 1600, time: "12:14 AM" },
  { name: "Grace L.", city: "Chicago, IL", treatment: "Microneedling + Exosomes", value: 690, time: "12:31 AM" },
  { name: "Bianca M.", city: "Scottsdale, AZ", treatment: "Morpheus8 Neck", value: 900, time: "12:48 AM" },
  { name: "Iris H.", city: "Seattle, WA", treatment: "Botox (40u) + Tox Lift", value: 620, time: "1:05 AM" },
];

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export function HeroLedger() {
  const scope = useGsap(({ gsap }) => {
    gsap.set("[data-hero-line]", { yPercent: 110 });
    gsap
      .timeline({ defaults: { ease: "power4.out" } })
      .to("[data-hero-badge]", { opacity: 1, y: 0, duration: 0.7 })
      .to("[data-hero-line]", { yPercent: 0, duration: 1.1, stagger: 0.09 }, "-=0.35")
      .to("[data-hero-sub]", { opacity: 1, y: 0, duration: 0.8 }, "-=0.7")
      .to("[data-hero-cta]", { opacity: 1, y: 0, duration: 0.7 }, "-=0.6")
      .fromTo(
        "[data-ledger-panel]",
        { opacity: 0, y: 40, rotateX: 8 },
        { opacity: 1, y: 0, rotateX: 0, duration: 1.2 },
        "-=1",
      );

    gsap.to("[data-caustic]", {
      backgroundPosition: "120% 60%",
      duration: 18,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  });

  const [rows, setRows] = useState<LedgerRow[]>(SEED);

  useEffect(() => {
    let i = 0;
    const id = window.setInterval(() => {
      setRows((prev) => {
        const next = POOL[i % POOL.length];
        i += 1;
        return [next, ...prev].slice(0, 6);
      });
    }, 3600);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section ref={scope} className="relative overflow-hidden">
      <div
        data-caustic
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(60rem 40rem at 12% -10%, rgba(232,197,176,0.35), transparent 60%), radial-gradient(48rem 40rem at 105% 20%, rgba(212,163,115,0.22), transparent 55%)",
          backgroundSize: "160% 160%",
        }}
      />
      <div className="container grid grid-cols-1 gap-y-14 pb-24 pt-16 lg:grid-cols-12 lg:gap-x-8 lg:pb-32 lg:pt-24">
        <div className="lg:col-span-7 lg:pt-10">
          <span
            data-hero-badge
            className="pill-button inline-flex translate-y-2 items-center gap-2 bg-pearl/60 px-4 py-1.5 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate opacity-0 backdrop-blur"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-champagne" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-champagne" />
            </span>
            After-hours clinical concierge
          </span>

          <h1 className="mt-7 font-display text-[2.9rem] leading-[1.05] text-espresso sm:text-6xl lg:text-[4.4rem]">
            <span className="block overflow-hidden">
              <span data-hero-line className="block">
                Capturing the
              </span>
            </span>
            <span className="block overflow-hidden">
              <span data-hero-line className="block italic text-[#a9763f]">
                $1,500 consultations
              </span>
            </span>
            <span className="block overflow-hidden">
              <span data-hero-line className="block">
                your front desk sleeps through.
              </span>
            </span>
          </h1>

          <p
            data-hero-sub
            className="mt-7 max-w-md translate-y-3 text-[1.05rem] leading-relaxed text-slate opacity-0"
          >
            Vespera answers every DM in seconds, checks the clinical rulebook before it ever
            says <span className="text-espresso">yes</span>, and drops a booking link while the
            lead is still warm.
          </p>

          <div data-hero-cta className="mt-9 flex translate-y-3 flex-wrap items-center gap-3 opacity-0">
            <Button asChild size="lg" variant="champagne">
              <Link href="/register">
                Request access
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#triage">See a live triage</a>
            </Button>
          </div>
        </div>

        <div className="lg:col-span-5" style={{ perspective: "1400px" }}>
          <div
            data-ledger-panel
            className="glass-panel overflow-hidden p-1.5"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="flex items-center justify-between px-4 py-3">
              <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-slate">
                Live aesthetic ledger
              </p>
              <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-sage">
                <span className="h-1.5 w-1.5 rounded-full bg-sage" />
                closing now
              </span>
            </div>
            <ul className="space-y-1.5">
              {rows.map((row, idx) => (
                <li
                  key={`${row.name}-${row.time}-${idx}`}
                  className={cn(
                    "rounded-[14px] border border-stroke/70 bg-pearl/80 px-4 py-3 transition-all",
                    idx === 0 && "animate-fade-up border-champagne/40 bg-champagne/[0.06]",
                  )}
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-espresso">{row.name}</p>
                    <p className="font-mono text-xs text-slate">{row.time}</p>
                  </div>
                  <div className="mt-1 flex items-baseline justify-between gap-3">
                    <p className="truncate text-xs text-slate">
                      {row.city} · {row.treatment}
                    </p>
                    <p className="font-mono text-xs font-medium text-[#a9763f]">
                      {formatUsd(row.value)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
