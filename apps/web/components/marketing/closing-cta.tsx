import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Magnetic } from "@/components/ui/magnetic";
import { Scene } from "@/components/marketing/scene";

const CITIES = ["Beverly Hills", "Miami", "London", "Dubai", "Paris", "New York", "Singapore", "Toronto"];

export function ClosingCta() {
  return (
    <section className="wash-amber section relative overflow-hidden">
      <Scene
        src="/media/cta-storefront"
        poster="/media/cta-exterior.webp"
        className="-z-10 opacity-50 [mask-image:radial-gradient(130%_100%_at_50%_50%,black,transparent_80%)]"
        objectPosition="50% 60%"
        dim={0.74}
      />
      <div className="container relative">
        <div className="border-y border-hairline py-16">
          <h2 className="max-w-3xl text-display-1 font-semibold text-espresso">
            Stop losing the bookings that go to{" "}
            <span className="text-grad">voicemail.</span>
          </h2>
          <p className="mt-5 max-w-xl text-[1.05rem] leading-relaxed text-slate">
            A 15-minute walkthrough of the live after-hours qualifier — your menu, your safety
            rules, your booking link, running against a real inbound conversation.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-3">
            <Magnetic strength={0.4}>
              <Button asChild size="lg" variant="primary">
                <Link href="/register">
                  Book the walkthrough
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </Button>
            </Magnetic>
            <Button asChild size="lg" variant="outline">
              <a href="/vespera-after-hours-briefing.pptx" download>
                Download the briefing
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-10 overflow-hidden border-y border-hairline py-4">
        <div className="flex w-max animate-marquee gap-10">
          {[...CITIES, ...CITIES].map((city, i) => (
            <span key={`${city}-${i}`} className="flex items-center gap-10 text-sm text-faint">
              {city}
              <span className="inline-block h-1 w-1 rounded-full bg-champagne/50" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
