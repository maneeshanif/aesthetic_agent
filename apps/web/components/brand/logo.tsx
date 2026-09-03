import { cn } from "@/lib/utils";

/** The Vespera monogram — an hourglass meeting an aesthetic droplet. */
export function VesperaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      className={cn("h-6 w-6 text-champagne", className)}
      aria-hidden="true"
    >
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        strokeDasharray="1 3"
      />
      <path d="M12 6v12M8 10l4-4 4 4M8 14l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function VesperaWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <VesperaMark />
      <span className="font-display text-xl tracking-tight text-espresso">Vespera</span>
    </span>
  );
}
