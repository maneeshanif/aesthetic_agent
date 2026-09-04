"use client";

import { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { useCountUp } from "@/lib/use-count-up";
import { useGsap } from "@/lib/use-gsap";
import { Scene } from "@/components/marketing/scene";
import { cn } from "@/lib/utils";

const HEADLINE_STATS = [
  { value: 41, suffix: "%", label: "of med-spa phone inquiries land after hours", decimals: 0 },
  { value: 67, suffix: "%", label: "of after-hours callers hang up without leaving a voicemail", decimals: 0 },
  { value: 21, prefix: "", suffix: "×", label: "more likely to qualify a lead if you reply within 5 minutes", decimals: 0 },
];

const LEAK = [
  { pct: "67%", head: "Hang up immediately", body: "Never leave a message. Most just call the next clinic on their list." },
  { pct: "20%", head: "Leave a voicemail", body: "But roughly a third never get called back in time. Intent cools overnight." },
  { pct: "13%", head: "Call a competitor", body: "The clinic that answers first wins the booking. Speed is the whole game." },
];

function Stat({
  value,
  prefix = "",
  suffix = "",
  label,
  run,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  label: string;
  run: boolean;
}) {
  const n = useCountUp(value, run);
  return (
    <div>
      <p className="font-display text-[clamp(2.6rem,6vw,4.2rem)] font-semibold leading-none tracking-editorial text-grad">
        {prefix}
        {Math.round(n)}
        {suffix}
      </p>
      <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-slate">{label}</p>
    </div>
  );
}

export function ProblemStats() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setRun(true), {
      threshold: 0.3,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scope = useGsap(({ gsap, scope: root }) => {
    gsap.from(root.querySelectorAll("[data-leak]"), {
      opacity: 0,
      y: 28,
      duration: 0.7,
      stagger: 0.09,
      ease: "power3.out",
      scrollTrigger: { trigger: root.querySelector("[data-leak-grid]"), start: "top 78%" },
    });
  });

  return (
    <section ref={scope} className="section border-t border-hairline">
      <div className="container" ref={ref}>
        <h2 className="max-w-3xl text-display-2 text-espresso">
          Your patients decide at 11&nbsp;PM. <span className="text-grad">Your front desk left at six.</span>
        </h2>
        <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-slate">
          Ideal med-spa clients are busy professionals — they research treatments after work, mid-scroll
          on Instagram. Weeknights 7–10&nbsp;PM and Sunday evenings are the highest-intent windows, and
          almost every clinic is dark for all of them.
        </p>

        <div className="relative mt-14 overflow-hidden rounded-card border-y border-hairline">
          <Scene
            poster="/media/problem-empty.webp"
            className="opacity-[0.28] [mask-image:linear-gradient(90deg,transparent,black_30%,black_70%,transparent)]"
            objectPosition="50% 60%"
            dim={0.82}
          />
          <div className="relative grid gap-10 py-12 sm:grid-cols-3">
            {HEADLINE_STATS.map((s) => (
              <Stat key={s.label} {...s} run={run} />
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h3 className="text-display-3 text-espresso">Where the money goes</h3>
          <div data-leak-grid className="mt-8 grid gap-6 md:grid-cols-3">
            {LEAK.map((l) => (
              <div
                key={l.head}
                data-leak
                className="rounded-card border border-stroke bg-pearl p-6"
              >
                <p className="font-display text-3xl font-semibold text-coral">{l.pct}</p>
                <p className="mt-2 text-sm font-medium text-espresso">{l.head}</p>
                <p className="mt-1.5 text-[0.9rem] leading-relaxed text-slate">{l.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 rounded-card border border-stroke bg-pearl p-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-[0.95rem] leading-relaxed text-strong">
            Clinics running evening ad spend lose <span className="text-espresso">$4k–$9k+ a month</span>{" "}
            to this gap. One missed Morpheus8 or filler package ($1,500–$2,500) can exceed a full month
            of software cost.
          </p>
          <a
            href="/vespera-after-hours-briefing.pptx"
            download
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-md border border-stroke px-4 py-2.5 text-sm text-espresso transition-colors",
              "hover:border-champagne/50 hover:bg-elevated active:scale-[0.98]",
            )}
          >
            <Download className="h-4 w-4" strokeWidth={1.75} />
            The after-hours briefing
          </a>
        </div>
      </div>
    </section>
  );
}
