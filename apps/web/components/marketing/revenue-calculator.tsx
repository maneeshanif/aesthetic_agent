"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useGsap } from "@/lib/use-gsap";

const INQUIRY_RATE = 0.058;
const AFTER_HOURS_SHARE = 0.42;
const RESPONSE_LIFT = 0.37;

function useCountUp(target: number, run: boolean) {
  const [value, setValue] = useState(0);
  const from = useRef(0);
  const raf = useRef(0);
  useEffect(() => {
    if (!run) return;
    const start = performance.now();
    const startVal = from.current;
    const tick = (now: number) => {
      const p = Math.min((now - start) / 680, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, run]);
  return run ? value : 0;
}

export function RevenueCalculator() {
  const [visitors, setVisitors] = useState(2400);
  const [ticket, setTicket] = useState(880);
  const [inView, setInView] = useState(false);

  const scope = useGsap(({ gsap, scope: root }) => {
    gsap.from(root.querySelectorAll("[data-calc-in]"), {
      opacity: 0,
      y: 28,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: root, start: "top 72%", onEnter: () => setInView(true) },
    });
  });

  const lost = useMemo(
    () => Math.round(visitors * INQUIRY_RATE * AFTER_HOURS_SHARE * RESPONSE_LIFT * ticket),
    [visitors, ticket],
  );
  const display = useCountUp(lost, inView);

  return (
    <section id="math" ref={scope} className="section">
      <div className="container">
        <h2 data-calc-in className="text-display-2 text-espresso">
          What after-hours silence costs, per month.
        </h2>

        <div data-calc-in className="mt-12 grid overflow-hidden rounded-card border border-stroke lg:grid-cols-[1.05fr_1fr]">
          <div className="border-b border-hairline bg-pearl p-9 lg:border-b-0 lg:border-r lg:p-12">
            <div className="space-y-9">
              <Slider label="Monthly website visitors" value={visitors} min={300} max={12000} step={100} onChange={setVisitors} format={(v) => v.toLocaleString()} />
              <Slider label="Average treatment price" value={ticket} min={200} max={3000} step={20} onChange={setTicket} format={(v) => `$${v.toLocaleString()}`} />
            </div>
          </div>

          <div className="flex flex-col justify-center bg-ink p-9 lg:p-12">
            <p className="text-sm text-champagne">Estimated lost after-hours revenue</p>
            <p className="mt-4 font-display text-[3.6rem] font-semibold leading-none tabular-nums text-espresso">
              ${display.toLocaleString()}
              <span className="ml-1.5 align-top font-sans text-base font-normal text-faint">/mo</span>
            </p>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-slate">
              Assumes a {(INQUIRY_RATE * 100).toFixed(1)}% inquiry rate, {Math.round(AFTER_HOURS_SHARE * 100)}% of
              it arriving after hours, and a {Math.round(RESPONSE_LIFT * 100)}% recovery lift from instant response.
            </p>
            <Button asChild variant="primary" size="lg" className="mt-8 w-full">
              <Link href="/register">Stop the leak</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  format: (v: number) => string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-slate">{label}</span>
        <span className="font-mono text-sm text-espresso">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full outline-none
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-champagne
          [&::-webkit-slider-thumb]:shadow-[0_0_0_4px_rgba(233,178,76,0.18)]
          [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-champagne"
        style={{
          background: `linear-gradient(to right, var(--accent-primary) ${pct}%, var(--surface-2) ${pct}%)`,
        }}
      />
    </div>
  );
}
