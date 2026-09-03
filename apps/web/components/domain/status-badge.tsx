import { Badge } from "@/components/ui/badge";
import { KNOWLEDGE_STATUS_META, PATIENT_STATUS_META } from "@/lib/format";
import type { KnowledgeStatus, PatientStatus } from "@/lib/types";

export function PatientStatusBadge({ status }: { status: PatientStatus }) {
  const meta = PATIENT_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function KnowledgeStatusBadge({ status }: { status: KnowledgeStatus }) {
  const meta = KNOWLEDGE_STATUS_META[status];
  return (
    <Badge tone={meta.tone}>
      {status === "chunking" ? (
        <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      ) : null}
      {meta.label}
    </Badge>
  );
}
