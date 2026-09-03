"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search, Users } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorPanel, TableSkeleton } from "@/components/dashboard/states";
import { PatientDetailDialog } from "@/components/domain/patient-detail-dialog";
import { PatientStatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CHANNEL_LABEL, currency, relativeTime } from "@/lib/format";
import { canEditPatients } from "@/lib/permissions";
import type { PatientStatus } from "@/lib/types";
import { useApi, useResource } from "@/lib/use-api";
import { useAppStore } from "@/store/app-store";

const PAGE_SIZE = 12;
const FILTERS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: "qualifying", label: "Qualifying" },
  { value: "medically_cleared", label: "Cleared" },
  { value: "contraindication_flagged", label: "Flagged" },
  { value: "booked", label: "Booked" },
];

export default function PatientsPage() {
  const api = useApi();
  const spaId = useAppStore((s) => s.activeSpaId);
  const role = useAppStore((s) => s.activeRole);
  const editable = canEditPatients(role);

  const [rawQuery, setRawQuery] = useState("");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setQuery(rawQuery.trim());
      setPage(0);
    }, 300);
    return () => window.clearTimeout(id);
  }, [rawQuery]);

  const list = useResource(
    () =>
      api.listPatients({
        q: query || undefined,
        status: status || undefined,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    [spaId, query, status, page],
    { enabled: Boolean(spaId) },
  );

  const totalPages = useMemo(
    () => (list.data ? Math.max(1, Math.ceil(list.data.total / PAGE_SIZE)) : 1),
    [list.data],
  );

  return (
    <div>
      <PageHeader
        title="Patients"
        description="Every lead who has spoken with Vespera, with the treatment they asked for and where triage left them."
      />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate" />
          <Input
            placeholder="Search name, treatment, phone…"
            value={rawQuery}
            onChange={(e) => setRawQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => {
                setStatus(f.value);
                setPage(0);
              }}
              className={
                status === f.value
                  ? "rounded-pill border border-champagne/40 bg-champagne/10 px-3 py-1 text-xs text-[#a9763f]"
                  : "rounded-pill border border-stroke bg-pearl/60 px-3 py-1 text-xs text-slate hover:text-espresso"
              }
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {list.loading ? (
        <TableSkeleton rows={8} />
      ) : list.error ? (
        <ErrorPanel error={list.error} onRetry={list.refetch} />
      ) : list.data && list.data.items.length > 0 ? (
        <>
          <div className="rounded-card border border-stroke bg-pearl/70">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Requested treatment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Est. value</TableHead>
                  <TableHead className="text-right">Captured</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.data.items.map((p) => (
                  <TableRow
                    key={p.id}
                    onClick={() => setSelected(p.id)}
                    className="cursor-pointer"
                  >
                    <TableCell className="font-medium">
                      {p.full_name ?? <span className="text-slate">Anonymous lead</span>}
                    </TableCell>
                    <TableCell className="text-slate">{CHANNEL_LABEL[p.channel]}</TableCell>
                    <TableCell className="text-slate">{p.requested_treatment ?? "—"}</TableCell>
                    <TableCell>
                      <PatientStatusBadge status={p.status as PatientStatus} />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-slate">
                      {currency(p.estimated_value)}
                    </TableCell>
                    <TableCell className="text-right text-slate">
                      {relativeTime(p.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-slate">
            <span>
              {list.data.total} lead{list.data.total === 1 ? "" : "s"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <span className="font-mono text-xs">
                {page + 1} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page + 1 >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </>
      ) : (
        <EmptyState
          icon={Users}
          title={query || status ? "No matching leads" : "No leads captured yet"}
          description={
            query || status
              ? "Try a different search or filter."
              : "Once Vespera talks to a patient, they'll appear here."
          }
        />
      )}

      <PatientDetailDialog
        patientId={selected}
        canEdit={editable}
        onClose={() => setSelected(null)}
        onSaved={list.refetch}
      />
    </div>
  );
}
