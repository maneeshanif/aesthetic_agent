import { AlertTriangle, Lock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiClientError } from "@/lib/api-client";

export function ErrorPanel({
  error,
  onRetry,
}: {
  error: Error | ApiClientError;
  onRetry?: () => void;
}) {
  const message =
    error instanceof ApiClientError ? error.message : "We couldn't load this. Try again.";
  return (
    <div className="flex flex-col items-center gap-4 rounded-card border border-terracotta/25 bg-terracotta/[0.05] px-6 py-12 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-pill border border-terracotta/30 bg-terracotta/10">
        <AlertTriangle className="h-5 w-5 text-terracotta" strokeWidth={1.5} />
      </span>
      <p className="text-sm text-espresso">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-3.5 w-3.5" />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function RoleDenied({ what = "this area" }: { what?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-stroke bg-elevated/40 px-6 py-16 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-pill border border-stroke bg-pearl">
        <Lock className="h-5 w-5 text-slate" strokeWidth={1.5} />
      </span>
      <p className="font-display text-lg text-espresso">Not available for your role</p>
      <p className="max-w-sm text-sm text-slate">
        Your permissions don't include {what}. Ask a workspace owner if you need access.
      </p>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-32 w-full rounded-card" />
      ))}
    </div>
  );
}
