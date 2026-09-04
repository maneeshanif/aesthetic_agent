import Link from "next/link";
import { VesperaWordmark } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-hairline bg-ink p-12 lg:flex">
        <span
          aria-hidden
          className="pointer-events-none absolute -left-32 top-0 h-[34rem] w-[34rem] rounded-full bg-champagne/[0.12] blur-[120px] motion-safe:animate-gold-drift"
        />
        <Link href="/" className="relative">
          <VesperaWordmark tagline />
        </Link>
        <blockquote className="relative">
          <p className="font-display text-[2rem] font-medium leading-snug text-espresso">
            It booked a $1,240 Morpheus8 consult at 11:42 PM, while the clinic was dark.
          </p>
          <footer className="mt-4 text-sm text-champagne">Dr. Marchetti Aesthetics — Miami</footer>
        </blockquote>
        <p className="relative text-xs text-faint">
          Lead triage &amp; booking for medical spas and aesthetic clinics
        </p>
      </aside>

      <div className="flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">
          <div className="mb-10 lg:hidden">
            <VesperaWordmark tagline />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
