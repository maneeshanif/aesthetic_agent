"use client";

import { useRef, useState } from "react";
import { FileText, Trash2, UploadCloud } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { ErrorPanel, RoleDenied, TableSkeleton } from "@/components/dashboard/states";
import { KnowledgeStatusBadge } from "@/components/domain/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toaster";
import { canManageKnowledge } from "@/lib/permissions";
import { ApiClientError } from "@/lib/api-client";
import { relativeTime } from "@/lib/format";
import { useApi, useResource } from "@/lib/use-api";
import { useAppStore } from "@/store/app-store";
import { cn } from "@/lib/utils";

function humanSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KnowledgePage() {
  const api = useApi();
  const spaId = useAppStore((s) => s.activeSpaId);
  const role = useAppStore((s) => s.activeRole);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const docs = useResource(() => api.listDocuments(), [spaId], { enabled: Boolean(spaId) });

  if (role && !canManageKnowledge(role)) {
    return (
      <div>
        <PageHeader title="Knowledge base" />
        <RoleDenied what="the knowledge base" />
      </div>
    );
  }

  async function upload(file: File) {
    setUploading(true);
    try {
      const doc = await api.uploadDocument(file);
      if (doc.status === "failed") {
        toast.error("Ingestion failed", { description: doc.error_message ?? undefined });
      } else {
        toast.success("Document embedded", { description: `${doc.chunk_count} chunks indexed` });
      }
      docs.refetch();
    } catch (e) {
      toast.error("Upload failed", {
        description: e instanceof ApiClientError ? e.message : undefined,
      });
    } finally {
      setUploading(false);
    }
  }

  async function remove(id: string) {
    setPendingDelete(id);
    try {
      await api.deleteDocument(id);
      toast.success("Document removed");
      docs.refetch();
    } catch (e) {
      toast.error("Couldn't delete", {
        description: e instanceof ApiClientError ? e.message : undefined,
      });
    } finally {
      setPendingDelete(null);
    }
  }

  return (
    <div>
      <PageHeader
        title="Knowledge base"
        description="Upload your treatment menu and protocol rules. Vespera chunks and embeds them, then triages strictly against what's here."
      />

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (file) upload(file);
        }}
        className={cn(
          "flex flex-col items-center justify-center rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors",
          dragging ? "border-champagne bg-champagne/[0.06]" : "border-stroke bg-elevated/40",
        )}
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-pill border border-champagne/25 bg-champagne/10">
          {uploading ? (
            <Spinner className="h-5 w-5" />
          ) : (
            <UploadCloud className="h-5 w-5 text-champagne" strokeWidth={1.5} />
          )}
        </span>
        <p className="mt-4 font-display text-lg text-espresso">
          {uploading ? "Chunking & embedding…" : "Drop a PDF or Markdown file"}
        </p>
        <p className="mt-1 text-sm text-slate">Menu, pricing, and contraindication rules. Up to 10 MB.</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-5"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Choose file
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.md,.markdown,.txt"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 font-display text-xl text-espresso">Active documents</h2>
        {docs.loading ? (
          <TableSkeleton rows={3} />
        ) : docs.error ? (
          <ErrorPanel error={docs.error} onRetry={docs.refetch} />
        ) : docs.data && docs.data.length > 0 ? (
          <ul className="space-y-2.5">
            {docs.data.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-4 rounded-card border border-stroke bg-pearl px-5 py-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-stroke bg-elevated">
                    <FileText className="h-4 w-4 text-slate" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-espresso">{doc.filename}</p>
                    <p className="text-xs text-slate">
                      {humanSize(doc.byte_size)} · {doc.chunk_count} chunks ·{" "}
                      {relativeTime(doc.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <KnowledgeStatusBadge status={doc.status} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(doc.id)}
                    disabled={pendingDelete === doc.id}
                    aria-label={`Delete ${doc.filename}`}
                  >
                    {pendingDelete === doc.id ? (
                      <Spinner />
                    ) : (
                      <Trash2 className="h-4 w-4 text-slate hover:text-terracotta" />
                    )}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={FileText}
            title="No documents yet"
            description="Upload your clinic's menu and protocol rules to give Vespera something to reason from."
          />
        )}
      </div>
    </div>
  );
}
