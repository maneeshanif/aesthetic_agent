"use client";

import { useRef } from "react";
import { MessageSquare, ScanLine, CalendarCheck } from "lucide-react";
import { useGsap } from "@/lib/use-gsap";

const CARDS = [
  {
    id: "01",
    icon: MessageSquare,
    title: "The Router",
    body: "A DM lands at 10:14 PM. Vespera classifies intent — pricing, medical, or ready-to-book — before a human would have unlocked their phone.",
    line: "Intent · Booking readiness · Channel",
  },
  {
    id: "02",
    icon: ScanLine,
    title: "Clinical Protocol Engine",
    body: "It reads your uploaded rulebook, not the open internet. Accutane in the thread → it diverts a chemical peel to a hydrafacial and says why.",
    line: "RAG over your menu · Contraindication scan",
  },
  {
    id: "03",
    icon: CalendarCheck,
    title: "Booking Hand-off",
    body: "Once the lead is medically cleared, it hands out your Boulevard or Zenoti link and files the lead in the CRM with the full reasoning trace.",
    line: "Direct booking link · Zero latency",
  },
];

export function TriageCanvas() {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scope = useGsap(({ gsap, scope }) => {
    gsap.from(scope.querySelectorAll("[data-triage-card]"), {
      opacity: 0,
      y: 60,
      duration: 0.9,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: scope, start: "top 70%" },
    });

    cardRefs.current.forEach((card) => {
      if (!card) return;
      const xTo = gsap.quickTo(card, "x", { duration: 0.5, ease: "power3" });
      const yTo = gsap.quickTo(card, "y", { duration: 0.5, ease: "power3" });
      const onMove = (e: MouseEvent) => {
        const r = card.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.06);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.08);
      };
      const reset = () => {
        xTo(0);
        yTo(0);
      };
      card.addEventListener("mousemove", onMove);
      card.addEventListener("mouseleave", reset);
    });
  });

  return (
    <section id="triage" ref={scope} className="border-y border-stroke/60 bg-elevated/30 py-24">
      <div className="container">
        <div className="max-w-2xl">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate">
            The multi-agent triage canvas
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight text-espresso sm:text-5xl">
            Three checkpoints between a midnight DM and a booked chair.
          </h2>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {CARDS.map((card, i) => (
            <div
              key={card.id}
              data-triage-card
              ref={(el) => {
                cardRefs.current[i] = el;
              }}
              className="group relative overflow-hidden rounded-card border border-stroke bg-pearl/80 p-7 shadow-glass transition-colors hover:border-champagne/45"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-champagne/10 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              />
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-pill border border-champagne/25 bg-champagne/10">
                  <card.icon className="h-5 w-5 text-champagne" strokeWidth={1.5} />
                </span>
                <span className="font-mono text-sm text-slate/70">{card.id}</span>
              </div>
              <h3 className="mt-6 font-display text-2xl text-espresso">{card.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate">{card.body}</p>
              <p className="mt-6 border-t border-stroke/70 pt-4 font-mono text-[0.7rem] uppercase tracking-[0.12em] text-slate/80">
                {card.line}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
