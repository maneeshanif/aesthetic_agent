"use client";

import { useEffect, useState } from "react";
import { CalendarClock, ShieldAlert } from "lucide-react";
import { PatientStatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormField } from "@/components/ui/form-field";
import { Input, Textarea } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";
import { ErrorPanel } from "@/components/dashboard/states";
import { ApiClientError } from "@/lib/api-client";
import { CHANNEL_LABEL, clockTime, currency, relativeTime } from "@/lib/format";
import type { PatientDetail, PatientStatus } from "@/lib/types";
import { useApi } from "@/lib/use-api";

const STATUS_OPTIONS: PatientStatus[] = [
  "new",
  "qualifying",
  "medically_cleared",
  "contraindication_flagged",
  "booked",
  "abandoned",
];

export function PatientDetailDialog({
  patientId,
  canEdit,
  onClose,
  onSaved,
}: {
  patientId: string | null;
  canEdit: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const api = useApi();
  const [detail, setDetail] = useState<PatientDetail | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<PatientStatus>("new");
  const [notes, setNotes] = useState("");
  const [value, setValue] = useState("");

  useEffect(() => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    api
      .getPatient(patientId)
      .then((d) => {
        setDetail(d);
        setStatus(d.status);
        setNotes(d.notes ?? "");
        setValue(d.estimated_value != null ? String(d.estimated_value) : "");
      })
      .catch((e) => setError(e as Error))
      .finally(() => setLoading(false));
  }, [patientId, api]);

  async function save() {
    if (!patientId) return;
    setSaving(true);
    try {
      await api.updatePatient(patientId, {
        status,
        notes: notes || null,
        estimated_value: value ? Number(value) : null,
      });
      toast.success("Lead updated");
      onSaved();
      onClose();
    } catch (e) {
      toast.error("Couldn't save", {
        description: e instanceof ApiClientError ? e.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={Boolean(patientId)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="h-6 w-6" />
          </div>
        ) : error ? (
          <ErrorPanel error={error} />
        ) : detail ? (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <DialogTitle>{detail.full_name ?? "Anonymous lead"}</DialogTitle>
                <PatientStatusBadge status={detail.status} />
              </div>
              <DialogDescription>
                {CHANNEL_LABEL[detail.channel]} · captured {relativeTime(detail.created_at)}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-stroke bg-elevated/40 p-4 text-sm">
              <Field label="Phone" value={detail.phone} />
              <Field label="Email" value={detail.email} />
              <Field label="Instagram" value={detail.instagram_handle} />
              <Field label="Requested" value={detail.requested_treatment} />
              <Field label="Est. value" value={currency(detail.estimated_value)} />
            </div>

            {detail.medical_flags.length > 0 && (
              <div className="rounded-lg border border-terracotta/25 bg-terracotta/[0.05] p-4">
                <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-terracotta">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Contraindication flags
                </p>
                <ul className="mt-2 space-y-1 text-sm text-espresso">
                  {detail.medical_flags.map((f, i) => (
                    <li key={i}>
                      <span className="font-medium">{f.rule}</span> — {f.detail}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-slate">
                Conversations ({detail.sessions.length})
              </p>
              {detail.sessions.length === 0 ? (
                <p className="text-sm text-slate">No sessions linked yet.</p>
              ) : (
                <ul className="space-y-1.5">
                  {detail.sessions.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between rounded-md border border-stroke bg-pearl/60 px-3 py-2 text-sm"
                    >
                      <span className="flex items-center gap-2 text-slate">
                        <CalendarClock className="h-3.5 w-3.5" />
                        {s.status} · {clockTime(s.last_message_at ?? s.created_at)}
                      </span>
                      {s.booking_url_issued ? (
                        <span className="font-mono text-xs text-sage">link issued</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {canEdit ? (
              <div className="space-y-4 border-t border-stroke pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label="Status" htmlFor="status">
                    <select
                      id="status"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as PatientStatus)}
                      className="flex h-11 w-full rounded-md border border-stroke bg-pearl/70 px-3.5 text-sm text-espresso focus-visible:border-champagne/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-champagne/25"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </FormField>
                  <FormField label="Est. value (USD)" htmlFor="value">
                    <Input
                      id="value"
                      type="number"
                      min={0}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                    />
                  </FormField>
                </div>
                <FormField label="Front-desk notes" htmlFor="notes">
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                </FormField>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button variant="champagne" onClick={save} disabled={saving}>
                    {saving ? "Saving…" : "Save changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="border-t border-stroke pt-4 text-xs text-slate">
                Read-only — ask a manager or owner to update this lead.
              </p>
            )}
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-[0.68rem] uppercase tracking-[0.12em] text-slate">{label}</p>
      <p className="mt-0.5 text-espresso">{value || "—"}</p>
    </div>
  );
}
