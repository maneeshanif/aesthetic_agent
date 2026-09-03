import { AlertTriangle, Lock, RotateCw } from "lucide-react";
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
    <div className="flex flex-col items-start gap-3 rounded-card border border-terracotta/25 bg-terracotta/[0.06] px-6 py-8">
      <AlertTriangle className="h-5 w-5 text-terracotta" strokeWidth={1.75} />
      <p className="text-sm text-espresso">{message}</p>
      {onRetry ? (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" strokeWidth={1.75} />
          Retry
        </Button>
      ) : null}
    </div>
  );
}

export function RoleDenied({ what = "this area" }: { what?: string }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-stroke bg-elevated/50 px-6 py-12">
      <Lock className="h-5 w-5 text-faint" strokeWidth={1.75} />
      <p className="font-display text-xl font-semibold text-espresso">Not available for your role</p>
      <p className="max-w-sm text-sm text-slate">
        Your permissions don't include {what}. Ask a workspace owner if you need access.
      </p>
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="divide-y divide-hairline border-y border-hairline">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

export function CardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-9 w-20" />
        </div>
      ))}
    </div>
  );
}
