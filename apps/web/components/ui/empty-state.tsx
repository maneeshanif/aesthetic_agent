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
        "flex flex-col items-center gap-3 rounded-card border border-dashed border-stroke bg-elevated/40 px-6 py-16 text-center",
        className,
      )}
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-champagne/10">
        <Icon className="h-5 w-5 text-champagne" strokeWidth={1.75} />
      </span>
      <p className="text-display-3 text-espresso">{title}</p>
      {description ? <p className="max-w-sm text-sm text-slate">{description}</p> : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
