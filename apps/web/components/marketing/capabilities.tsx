"use client";

import { useState } from "react";
import { ShieldCheck, CalendarClock, Database } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  {
    icon: ShieldCheck,
    title: "Medical guardrails",
    body: "Checks Accutane, active tans, recent filler, and pregnancy against the protocol rulebook you uploaded — retrieved and enforced before it books a laser. Not the open internet. Your rules.",
  },
  {
    icon: CalendarClock,
    title: "Direct booking",
    body: "Hands out the Boulevard, Zenoti, or NexHealth link you already use, the moment a lead is cleared. Nothing new for your front desk to learn, no scheduler to migrate.",
  },
  {
    icon: Database,
    title: "Built-in CRM",
    body: "Every lead who talks to the bot lands in a data grid with their requested treatment, flag status, estimated value, and the full reasoning trace, ready for follow-up.",
  },
];

export function Capabilities() {
  const [open, setOpen] = useState(0);

  return (
    <section className="section border-t border-hairline">
      <div className="container">
        <h2 className="max-w-3xl text-display-2 text-espresso">
          What ships the day you turn it on.
        </h2>

        <div className="mt-14 flex flex-col gap-3 lg:h-[24rem] lg:flex-row">
          {ITEMS.map((item, i) => {
            const active = open === i;
            return (
              <button
                key={item.title}
                onMouseEnter={() => setOpen(i)}
                onFocus={() => setOpen(i)}
                onClick={() => setOpen(i)}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-card border border-stroke p-7 text-left transition-[flex-grow,background-color,border-color] duration-500 [transition-timing-function:cubic-bezier(0.32,0.72,0,1)]",
                  "lg:min-w-0",
                  active ? "bg-pearl lg:flex-[3]" : "bg-canvas lg:flex-[1]",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-px transition-colors",
                    active ? "bg-champagne" : "bg-transparent",
                  )}
                />
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      active ? "bg-champagne/15 text-champagne" : "bg-elevated text-slate",
                    )}
                  >
                    <item.icon className="h-5 w-5" strokeWidth={1.75} />
                  </span>
                  <h3
                    className={cn(
                      "font-display text-xl font-semibold transition-colors",
                      active ? "text-espresso" : "text-slate",
                    )}
                  >
                    {item.title}
                  </h3>
                </div>
                <p
                  className={cn(
                    "mt-6 max-w-md text-[0.95rem] leading-relaxed text-slate transition-opacity duration-500 lg:mt-0",
                    active ? "opacity-100" : "opacity-100 lg:opacity-0",
                  )}
                >
                  {item.body}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
