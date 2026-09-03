"use client";

import { ShieldPlus, Link2, Database } from "lucide-react";
import { useGsap } from "@/lib/use-gsap";

const FEATURES = [
  {
    icon: ShieldPlus,
    title: "Medical guardrails",
    body: "Ensures patients aren't on Accutane before booking lasers — enforced from your own protocol rulebook, not guesswork.",
  },
  {
    icon: Link2,
    title: "Direct booking",
    body: "Hands out your existing Boulevard, Zenoti, or NexHealth link the moment a lead is cleared. No new scheduler to learn.",
  },
  {
    icon: Database,
    title: "Built-in CRM",
    body: "Every lead who talks to the bot lands in a data grid with their requested treatment, flag status, and full reasoning trace.",
  },
];

export function FeatureRibbon() {
  const scope = useGsap(({ gsap, scope }) => {
    gsap.from(scope.querySelectorAll("[data-feature]"), {
      opacity: 0,
      y: 40,
      duration: 0.8,
      stagger: 0.12,
      ease: "power3.out",
      scrollTrigger: { trigger: scope, start: "top 75%" },
    });
  });

  return (
    <section ref={scope} className="border-t border-stroke/60 bg-elevated/30 py-24">
      <div className="container grid gap-10 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} data-feature className="flex flex-col gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-pill border border-champagne/25 bg-champagne/10">
              <f.icon className="h-5 w-5 text-champagne" strokeWidth={1.5} />
            </span>
            <h3 className="font-display text-2xl text-espresso">{f.title}</h3>
            <p className="text-sm leading-relaxed text-slate">{f.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
