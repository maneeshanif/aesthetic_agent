"use client";

import Link from "next/link";
import { ArrowUpRight, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { CardsSkeleton, ErrorPanel, TableSkeleton } from "@/components/dashboard/states";
import { PatientStatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useApi, useResource } from "@/lib/use-api";
import { CHANNEL_LABEL, currency, percent, relativeTime } from "@/lib/format";
import { useAppStore } from "@/store/app-store";

export default function OverviewPage() {
  const api = useApi();
  const spaId = useAppStore((s) => s.activeSpaId);

  const overview = useResource(() => api.getOverview(), [spaId], { enabled: Boolean(spaId) });
  const recent = useResource(
    () => api.listPatients({ limit: 6 }),
    [spaId],
    { enabled: Boolean(spaId) },
  );

  return (
    <div>
      <PageHeader
        title="Overview"
        description="What Vespera handled while your front desk was closed."
      />

      {overview.loading ? (
        <CardsSkeleton count={4} />
      ) : overview.error ? (
        <ErrorPanel error={overview.error} onRetry={overview.refetch} />
      ) : overview.data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricTile
            label="Leads captured"
            value={String(overview.data.leads_captured)}
            sub="all-time conversations that produced a lead"
          />
          <MetricTile
            label="AI conversations"
            value={String(overview.data.ai_conversations)}
            sub={`${overview.data.after_hours_bookings} after-hours bookings`}
          />
          <MetricTile
            label="Booking click-through"
            value={percent(overview.data.booking_click_through_rate)}
            accent
            sub="links handed out per conversation"
          />
          <MetricTile
            label="Contraindication rate"
            value={percent(overview.data.contraindication_flag_rate)}
            sub="leads diverted on a safety flag"
          />
        </div>
      ) : null}

      <div className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-espresso">Patient triage stream</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/patients">
              View all
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        {recent.loading ? (
          <TableSkeleton rows={5} />
        ) : recent.error ? (
          <ErrorPanel error={recent.error} onRetry={recent.refetch} />
        ) : recent.data && recent.data.items.length > 0 ? (
          <ul className="space-y-2.5">
            {recent.data.items.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-4 rounded-card border border-stroke bg-pearl/70 px-5 py-4"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2.5">
                    <p className="truncate text-sm font-medium text-espresso">
                      {p.full_name ?? "Anonymous lead"}
                    </p>
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.1em] text-slate/70">
                      {CHANNEL_LABEL[p.channel]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate">
                    {p.requested_treatment ?? "Treatment TBD"} · {relativeTime(p.created_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="hidden font-mono text-xs text-slate sm:inline">
                    {currency(p.estimated_value)}
                  </span>
                  <PatientStatusBadge status={p.status} />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={Sparkles}
            title="No leads yet"
            description="Run a conversation in the Simulator to see how Vespera triages an inbound patient."
            action={
              <Button asChild variant="champagne" size="sm">
                <Link href="/dashboard/chat-tester">Open Simulator</Link>
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
}
