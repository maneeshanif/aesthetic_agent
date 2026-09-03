import { cn } from "@/lib/utils";

/** Vespera mark — the evening star over the horizon line. */
export function VesperaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      className={cn("h-6 w-6 text-champagne", className)}
      aria-hidden="true"
    >
      <path
        d="M14 3.5l1.9 5.3a5 5 0 003.3 3.3l5.3 1.9-5.3 1.9a5 5 0 00-3.3 3.3L14 24.5l-1.9-5.3a5 5 0 00-3.3-3.3L3.5 14l5.3-1.9a5 5 0 003.3-3.3L14 3.5z"
        fill="currentColor"
        fillOpacity="0.9"
      />
    </svg>
  );
}

export function VesperaWordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <VesperaMark />
      <span className="font-display text-[1.35rem] font-semibold leading-none tracking-editorial text-espresso">
        Vespera
      </span>
    </span>
  );
}
