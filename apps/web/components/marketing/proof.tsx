"use client";

import { useEffect, useRef, useState } from "react";
import { useCountUp } from "@/lib/use-count-up";
import { useGsap } from "@/lib/use-gsap";
import { Scene } from "@/components/marketing/scene";

const RESULTS = [
  {
    render: (n: number) => `$${Math.round(n).toLocaleString()}`,
    target: 23280,
    label: "extra revenue in 60 days at one Texas med spa",
  },
  {
    render: (n: number) => `${Math.round(n)}%`,
    target: 99,
    label: "call answer rate, up from 60–70% before",
  },
  {
    render: (n: number) => `${n.toFixed(0)}×`,
    target: 4,
    label: "more after-hours bookings captured (3–5× typical)",
  },
];

export function Proof() {
  const ref = useRef<HTMLDivElement>(null);
  const [run, setRun] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setRun(true), {
      threshold: 0.35,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scope = useGsap(({ gsap, scope: root }) => {
    gsap.from(root.querySelectorAll("[data-result]"), {
      opacity: 0,
      y: 26,
      duration: 0.7,
      stagger: 0.1,
      ease: "power3.out",
      scrollTrigger: { trigger: root, start: "top 76%" },
    });
  });

  return (
    <section ref={scope} className="section border-t border-hairline">
      <div className="container" ref={ref}>
        <h2 className="max-w-2xl text-display-2 text-espresso">
          One recovered treatment covers the month.
        </h2>

        <div className="mt-14 grid gap-10 border-y border-hairline py-12 sm:grid-cols-3">
          {RESULTS.map((r) => (
            <Result key={r.label} {...r} run={run} />
          ))}
        </div>

        <div className="mt-12 grid gap-10 lg:grid-cols-[1.35fr_1fr] lg:items-stretch">
          <p className="max-w-3xl self-center text-[1.05rem] leading-relaxed text-strong">
            Patients are already asking after hours — front desks simply cannot cover evenings and
            weekends consistently. Instant AI replies plus intelligent voice recovery turn inquiries
            that used to go to voicemail or a competitor into booked consultations, usually paying for
            the system with a single treatment.
          </p>
          <figure className="relative aspect-[4/5] overflow-hidden rounded-card border border-stroke sm:aspect-[3/2] lg:aspect-auto">
            <Scene
              src="/media/proof-owner"
              poster="/media/proof-portrait.webp"
              objectPosition="50% 30%"
              dim={0.4}
            />
            <figcaption className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-ink/90 to-transparent p-5 text-sm text-strong">
              Owner, single-location med spa · Texas
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

function Result({
  render,
  target,
  label,
  run,
}: {
  render: (n: number) => string;
  target: number;
  label: string;
  run: boolean;
}) {
  const n = useCountUp(target, run);
  return (
    <div data-result>
      <p className="font-display text-[clamp(2.4rem,5.5vw,3.8rem)] font-semibold leading-none tracking-editorial text-grad">
        {render(n)}
      </p>
      <p className="mt-3 max-w-[15rem] text-sm leading-relaxed text-slate">{label}</p>
    </div>
  );
}
