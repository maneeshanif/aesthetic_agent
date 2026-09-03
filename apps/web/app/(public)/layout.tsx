import Link from "next/link";
import { VesperaWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#triage", label: "Triage engine" },
  { href: "#voice", label: "Voice recovery" },
  { href: "#calculator", label: "ROI" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-stroke/60 bg-canvas/70 backdrop-blur-glass">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" aria-label="Vespera AI home">
            <VesperaWordmark />
          </Link>
          <nav className="hidden items-center gap-8 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm text-slate transition-colors hover:text-espresso"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="champagne" size="sm">
              <Link href="/register">Request access</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-stroke/60 bg-elevated/40">
        <div className="container flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <VesperaWordmark />
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-slate">
            <Link href="/login" className="hover:text-espresso">
              Login
            </Link>
            <a href="#" className="hover:text-espresso">
              Terms
            </a>
            <a href="#" className="hover:text-espresso">
              Privacy
            </a>
          </div>
          <p className="font-mono text-xs text-slate">
            © {new Date().getFullYear()} Vespera AI — After-hours clinical concierge
          </p>
        </div>
      </footer>
    </div>
  );
}
