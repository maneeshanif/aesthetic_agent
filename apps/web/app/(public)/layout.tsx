import Link from "next/link";
import { VesperaWordmark } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

const NAV = [
  { href: "#triage", label: "Triage" },
  { href: "#voice", label: "Voice recovery" },
  { href: "#math", label: "The math" },
];

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen w-full max-w-full flex-col overflow-x-hidden">
      {/* Floating glass pill nav */}
      <header className="fixed inset-x-0 top-4 z-50 flex justify-center px-4">
        <div className="flex w-full max-w-4xl items-center justify-between gap-4 rounded-pill border border-stroke bg-pearl/70 px-3 py-2 backdrop-blur-glass">
          <Link href="/" aria-label="Vespera home" className="pl-2">
            <VesperaWordmark />
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
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
          <div className="flex items-center gap-1.5">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild variant="primary" size="sm">
              <Link href="/register">Request access</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-full flex-1 overflow-x-hidden">{children}</main>

      <footer className="border-t border-hairline">
        <div className="container py-16">
          <div className="flex flex-col gap-10 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-sm">
              <VesperaWordmark />
              <p className="mt-4 text-sm leading-relaxed text-slate">
                The after-hours clinical concierge for aesthetic medicine. Beverly Hills, Miami,
                London, Dubai.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-x-14 gap-y-2.5 text-sm text-slate">
              <Link href="/login" className="hover:text-espresso">
                Sign in
              </Link>
              <a href="#triage" className="hover:text-espresso">
                Triage
              </a>
              <a href="#voice" className="hover:text-espresso">
                Voice
              </a>
              <a href="#" className="hover:text-espresso">
                Terms
              </a>
              <a href="#" className="hover:text-espresso">
                Privacy
              </a>
              <a href="#" className="hover:text-espresso">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-14 flex items-baseline justify-between border-t border-hairline pt-5 text-xs text-faint">
            <p>© {new Date().getFullYear()} Vespera</p>
            <p>Vesper — the evening star</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
