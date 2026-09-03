"use client";

import { Scene } from "@/components/marketing/scene";
import { useGsap } from "@/lib/use-gsap";
import { cn } from "@/lib/utils";

const PHASES = [
  {
    n: "01",
    title: "Multi-tenant triage",
    body: "Isolated data per clinic, RAG on your protocol rulebook, one AI worker qualifying leads.",
    status: "Live",
  },
  {
    n: "02",
    title: "Multi-agent reasoning",
    body: "Router, clinical-protocol, and booking agents with a full tool-calling loop and saved transcripts.",
    status: "Next",
  },
  {
    n: "03",
    title: "Omnichannel inbox",
    body: "Instagram and web-chat webhooks, a live unified inbox, human takeover, and native PMS sync.",
    status: "Planned",
  },
  {
    n: "04",
    title: "Outbound voice recovery",
    body: "A voice adapter calls back leads stalled over two hours and closes the booking on the phone.",
    status: "Planned",
  },
  {
    n: "05",
    title: "Inbound receptionist",
    body: "Ported front-desk number, real-time spoken triage, SMS booking links — full telephony cover.",
    status: "Planned",
  },
];

export function Roadmap() {
  const scope = useGsap(({ gsap, scope: root }) => {
    gsap.from(root.querySelectorAll("[data-phase]"), {
      opacity: 0,
      y: 30,
      duration: 0.7,
      stagger: 0.08,
      ease: "power3.out",
      scrollTrigger: { trigger: root.querySelector("[data-track]"), start: "top 80%" },
    });
  });

  return (
    <section
      ref={scope}
      className="relative overflow-hidden border-t border-hairline bg-ink section"
    >
      <Scene
        src="/media/roadmap-network"
        poster="/media/roadmap-network.webp"
        className="opacity-40 [mask-image:radial-gradient(120%_120%_at_50%_40%,black,transparent_78%)]"
        objectPosition="center"
        dim={0.78}
      />

      <div className="container relative">
        <h2 className="max-w-2xl text-display-2 text-espresso">
          One worker today. <span className="text-grad">A whole front office on the roadmap.</span>
        </h2>
        <p className="mt-4 max-w-xl text-[0.98rem] leading-relaxed text-slate">
          Vespera ships as a single triage agent. The same tenancy, rulebook, and booking layer carry
          every stage after it — nothing you set up now gets rebuilt later.
        </p>

        <ol
          data-track
          className="mt-14 grid gap-4 md:grid-cols-3 lg:grid-cols-5"
        >
          {PHASES.map((p) => (
            <li
              key={p.n}
              data-phase
              className="flex flex-col rounded-card border border-stroke bg-pearl/70 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-faint">{p.n}</span>
                <span
                  className={cn(
                    "rounded-pill px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide",
                    p.status === "Live"
                      ? "bg-sage/15 text-sage"
                      : p.status === "Next"
                        ? "bg-champagne/15 text-champagne"
                        : "bg-elevated text-faint",
                  )}
                >
                  {p.status}
                </span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-espresso">{p.title}</h3>
              <p className="mt-2 text-[0.85rem] leading-relaxed text-slate">{p.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
