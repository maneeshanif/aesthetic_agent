"use client";

import { useRef } from "react";
import { MessageSquareText, ScanLine, CalendarCheck2 } from "lucide-react";
import { Scene } from "@/components/marketing/scene";
import { useGsap } from "@/lib/use-gsap";

const PANELS = [
  {
    icon: MessageSquareText,
    title: "It reads the intent",
    body: "A DM lands at 10:14 PM. Vespera reads it in one pass — pricing question, medical question, or ready-to-book — and picks the path before a human would have unlocked their phone.",
    trace: ["intent            pricing_inquiry", "booking_readiness 0.31", "channel           instagram_dm"],
  },
  {
    icon: ScanLine,
    title: "It checks the rulebook",
    body: "It reasons over the menu and contraindication rules you uploaded — nothing else. “I’m on Accutane” in the thread diverts a chemical peel to a HydraFacial, and it says why in plain language.",
    trace: ["retrieve  peel_protocol.md  0.91", "flag      isotretinoin  →  BLOCK", "reroute   chemical_peel → hydrafacial"],
  },
  {
    icon: CalendarCheck2,
    title: "It closes the loop",
    body: "Once the lead is medically cleared, Vespera hands out your Boulevard or Zenoti link and files the lead in the CRM with the full reasoning trace attached.",
    trace: ["status  medically_cleared", "issue   booking_url → boulevard", "crm.upsert(lead)  ok  142ms"],
  },
];

const PANEL_STILLS = [
  "/media/triage-1-glass.webp",
  "/media/triage-2-aperture.webp",
  "/media/triage-3-approved.webp",
];

export function TriageCanvas() {
  const trackRef = useRef<HTMLDivElement>(null);

  const scope = useGsap(({ gsap, scope: root }) => {
    const track = trackRef.current;
    if (!track || !window.matchMedia("(min-width: 1024px)").matches) {
      // Mobile: gentle per-panel reveal instead of a pin.
      root.querySelectorAll("[data-panel]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 32,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 80%" },
        });
      });
      return;
    }

    const distance = () => track.scrollWidth - window.innerWidth + 96;
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: root,
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        anticipatePin: 1,
      },
    });
  });

  return (
    <section
      ref={scope}
      className="relative border-y border-hairline bg-ink lg:min-h-[100dvh] lg:overflow-hidden"
    >
      <Scene
        src="/media/triage-threading"
        poster="/media/triage-2-aperture.webp"
        className="opacity-30 [mask-image:radial-gradient(120%_120%_at_50%_50%,black,transparent_80%)]"
        objectPosition="center"
        dim={0.8}
        scrub
      />
      <div className="container relative pt-16 lg:pt-20">
        <h2 className="max-w-2xl text-display-2 text-espresso">
          Three moves between a midnight message and a booked chair.
        </h2>
      </div>

      <div
        ref={trackRef}
        className="mt-12 flex flex-col gap-6 px-5 pb-16 lg:mt-16 lg:h-[62vh] lg:flex-row lg:items-stretch lg:gap-8 lg:px-0 lg:pl-[max(1.25rem,calc((100vw-1320px)/2+2rem))]"
      >
        {PANELS.map((p, i) => (
          <article
            key={p.title}
            data-panel
            className="relative flex shrink-0 flex-col justify-between overflow-hidden rounded-card border border-stroke bg-pearl p-8 lg:w-[38rem]"
          >
            <Scene
              poster={PANEL_STILLS[i]}
              className="opacity-25 [mask-image:linear-gradient(180deg,black,transparent)]"
              objectPosition="center"
              dim={0.85}
            />
            <div className="relative">
              <span
                data-panel-in
                className="flex h-11 w-11 items-center justify-center rounded-full bg-champagne/12"
              >
                <p.icon className="h-5 w-5 text-champagne" strokeWidth={1.75} />
              </span>
              <p data-panel-in className="mt-6 font-mono text-xs text-faint">
                0{i + 1} / 03
              </p>
              <h3 data-panel-in className="mt-2 text-display-3 text-espresso">
                {p.title}
              </h3>
              <p data-panel-in className="mt-3 max-w-md text-[0.95rem] leading-relaxed text-slate">
                {p.body}
              </p>
            </div>
            <pre
              data-panel-in
              className="relative mt-8 overflow-x-auto rounded-md border border-hairline bg-ink/90 px-4 py-3.5 font-mono text-[0.72rem] leading-relaxed text-slate backdrop-blur-sm"
            >
              {p.trace.join("\n")}
            </pre>
          </article>
        ))}
      </div>
    </section>
  );
}
