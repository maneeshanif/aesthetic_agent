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
    <div
      className={cn(
        "rounded-card border border-stroke bg-pearl/80 p-5 shadow-glass backdrop-blur-glass",
        "[box-shadow:inset_0_1px_0_rgba(255,255,255,0.8),0_8px_40px_-16px_rgba(26,23,21,0.16)]",
      )}
    >
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-slate">{label}</p>
      <p
        className={cn(
          "mt-3 font-display text-[2.1rem] leading-none tabular-nums",
          accent ? "text-[#a9763f]" : "text-espresso",
        )}
      >
        {value}
      </p>
      {sub ? <p className="mt-2 text-xs text-slate">{sub}</p> : null}
    </div>
  );
}
