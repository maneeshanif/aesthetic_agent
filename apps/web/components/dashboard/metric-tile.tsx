import { cn } from "@/lib/utils";

export function MetricTile({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[0.72rem] uppercase tracking-[0.06em] text-faint">{label}</p>
      <p
        className={cn(
          "mt-2.5 font-display text-[2.3rem] font-semibold leading-none tabular-nums",
          accent ? "text-champagne" : "text-espresso",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-2 text-xs leading-relaxed text-slate">{sub}</p> : null}
    </div>
  );
}
