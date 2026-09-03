"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function useOdometer(target: number) {
  const [value, setValue] = useState(target);
  const raf = useRef(0);
  const from = useRef(target);

  useEffect(() => {
    const start = performance.now();
    const startVal = from.current;
    const duration = 650;
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(startVal + (target - startVal) * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target]);

  return value;
}

const AFTER_HOURS_SHARE = 0.42;
const RESPONSE_LIFT = 0.35;

export function RevenueCalculator() {
  const [visitors, setVisitors] = useState(2200);
  const [ticket, setTicket] = useState(850);

  const lost = useMemo(() => {
    const inquiries = visitors * 0.06;
    const afterHours = inquiries * AFTER_HOURS_SHARE;
    return Math.round(afterHours * RESPONSE_LIFT * ticket);
  }, [visitors, ticket]);

  const display = useOdometer(lost);

  return (
    <section id="calculator" className="py-24">
      <div className="container">
        <div className="grid gap-12 rounded-card border border-stroke bg-pearl/70 p-8 shadow-glass backdrop-blur-glass lg:grid-cols-[1.1fr_1fr] lg:p-12">
          <div>
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate">
              Revenue leakage calculator
            </p>
            <h2 className="mt-4 font-display text-4xl leading-tight text-espresso">
              What after-hours silence costs you every month.
            </h2>

            <div className="mt-9 space-y-7">
              <Slider
                label="Monthly website visitors"
                value={visitors}
                min={300}
                max={12000}
                step={100}
                onChange={setVisitors}
                format={(v) => v.toLocaleString()}
              />
              <Slider
                label="Average treatment price"
                value={ticket}
                min={200}
                max={3000}
                step={50}
                onChange={setTicket}
                format={(v) => `$${v.toLocaleString()}`}
              />
            </div>
          </div>

          <div className="flex flex-col justify-center rounded-card bg-[#211c19] p-8 text-[#f3efea]">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.18em] text-champagne/80">
              Estimated lost after-hours revenue
            </p>
            <p className="mt-3 font-display text-[3.4rem] leading-none tabular-nums text-champagne">
              ${display.toLocaleString()}
              <span className="ml-1 align-top font-sans text-base text-[#c9c1b7]">/mo</span>
            </p>
            <p className="mt-4 text-sm text-[#c9c1b7]">
              Based on ~6% inquiry rate, {Math.round(AFTER_HOURS_SHARE * 100)}% arriving after
              hours, and a {Math.round(RESPONSE_LIFT * 100)}% recovery lift from instant response.
            </p>
            <Button asChild variant="champagne" size="lg" className="mt-7 w-full">
              <Link href="/register">Stop the leakage with Vespera</Link>
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
        <label className="text-xs font-medium uppercase tracking-[0.14em] text-slate">{label}</label>
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
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-pill outline-none
          [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-champagne/40
          [&::-webkit-slider-thumb]:bg-champagne [&::-webkit-slider-thumb]:shadow-champagne-glow
          [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-champagne"
        style={{
          background: `linear-gradient(to right, var(--accent-primary) ${pct}%, var(--border-subtle) ${pct}%)`,
        }}
      />
    </div>
  );
}
