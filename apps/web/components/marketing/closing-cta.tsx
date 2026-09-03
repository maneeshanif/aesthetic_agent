import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ClosingCta() {
  return (
    <section className="py-24">
      <div className="container">
        <div className="relative overflow-hidden rounded-card border border-champagne/30 bg-pearl px-8 py-16 text-center shadow-champagne-glow sm:px-16">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                "radial-gradient(30rem 20rem at 50% -20%, rgba(232,197,176,0.4), transparent 60%)",
            }}
          />
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-slate">
            Beverly Hills · Miami · London · Dubai
          </p>
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl leading-tight text-espresso sm:text-5xl">
            Your best month starts the night you stop missing 11 PM.
          </h2>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" variant="champagne">
              <Link href="/register">
                Request access
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
