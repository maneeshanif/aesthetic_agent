import Link from "next/link";
import { VesperaWordmark } from "@/components/brand/logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#211c19] p-12 text-[#f3efea] lg:flex">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            backgroundImage:
              "radial-gradient(36rem 26rem at 20% 0%, rgba(212,163,115,0.22), transparent 60%), radial-gradient(30rem 24rem at 90% 100%, rgba(232,197,176,0.14), transparent 55%)",
          }}
        />
        <Link href="/" className="relative text-[#f3efea]">
          <span className="inline-flex items-center gap-2">
            <span className="font-display text-xl">Vespera</span>
          </span>
        </Link>
        <div className="relative">
          <p className="font-display text-3xl leading-snug">
            &ldquo;It booked a $1,250 Morpheus8 consult at 11:42 PM while the clinic was
            dark.&rdquo;
          </p>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.16em] text-champagne/80">
            Sterling Aesthetics — Miami, FL
          </p>
        </div>
        <div className="relative font-mono text-[0.7rem] uppercase tracking-[0.16em] text-[#8c8378]">
          After-hours clinical concierge
        </div>
      </aside>

      <div className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <VesperaWordmark />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
