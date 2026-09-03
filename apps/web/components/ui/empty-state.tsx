import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-card border border-dashed border-stroke bg-elevated/40 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-pill border border-champagne/25 bg-champagne/10">
        <Icon className="h-5 w-5 text-champagne" strokeWidth={1.5} />
      </span>
      <p className="font-display text-lg text-espresso">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-sm text-slate">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
