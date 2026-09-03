import { apiFetch, type RequestOptions } from "@/lib/api-client";
import type {
  ChatResponse,
  KnowledgeDoc,
  Member,
  Overview,
  Paginated,
  Patient,
  PatientDetail,
  Role,
  SessionDetail,
  Tenant,
} from "@/lib/types";

/** Build a tenant-scoped API surface. `token` = Supabase access token. */
export function createApi(token: string | null, spaId: string | null) {
  const base = (opts: RequestOptions = {}): RequestOptions => ({
    ...opts,
    token: token ?? undefined,
    headers: {
      ...(spaId ? { "X-Spa-Id": spaId } : {}),
      ...opts.headers,
    },
  });

  return {
    // ── tenant ──
    createTenant: (body: { name: string; slug: string; timezone?: string }) =>
      apiFetch<Tenant>("/api/v1/tenant", base({ method: "POST", body })),
    getTenant: () => apiFetch<Tenant>("/api/v1/tenant", base()),
    updateTenant: (body: Partial<Pick<Tenant, "name" | "timezone" | "booking_url">>) =>
      apiFetch<Tenant>("/api/v1/tenant", base({ method: "PATCH", body })),
    syncAuth: () =>
      apiFetch<{ user_id: string; spa_ids: string[]; memberships: Record<string, Role> }>(
        "/api/v1/auth/sync",
        base({ method: "POST" }),
      ),

    // ── team ──
    listMembers: () => apiFetch<Member[]>("/api/v1/tenant/members", base()),
    inviteMember: (body: { email: string; role: Role }) =>
      apiFetch<Member>("/api/v1/tenant/members", base({ method: "POST", body })),
    updateMember: (id: string, body: { role?: Role; status?: "active" | "disabled" }) =>
      apiFetch<Member>(`/api/v1/tenant/members/${id}`, base({ method: "PATCH", body })),
    removeMember: (id: string) =>
      apiFetch<void>(`/api/v1/tenant/members/${id}`, base({ method: "DELETE" })),

    // ── patients ──
    listPatients: (params: { q?: string; status?: string; limit?: number; offset?: number } = {}) => {
      const qs = new URLSearchParams();
      if (params.q) qs.set("q", params.q);
      if (params.status) qs.set("status", params.status);
      qs.set("limit", String(params.limit ?? 25));
      qs.set("offset", String(params.offset ?? 0));
      return apiFetch<Paginated<Patient>>(`/api/v1/patients?${qs}`, base());
    },
    getPatient: (id: string) => apiFetch<PatientDetail>(`/api/v1/patients/${id}`, base()),
    updatePatient: (
      id: string,
      body: Partial<Pick<Patient, "status" | "notes" | "estimated_value" | "full_name" | "requested_treatment">>,
    ) => apiFetch<Patient>(`/api/v1/patients/${id}`, base({ method: "PATCH", body })),

    // ── knowledge ──
    listDocuments: () => apiFetch<KnowledgeDoc[]>("/api/v1/knowledge/documents", base()),
    uploadDocument: (file: File) => {
      const form = new FormData();
      form.append("file", file);
      return apiFetch<KnowledgeDoc>("/api/v1/knowledge/documents", {
        method: "POST",
        token: token ?? undefined,
        headers: spaId ? { "X-Spa-Id": spaId } : {},
        body: form,
      });
    },
    deleteDocument: (id: string) =>
      apiFetch<void>(`/api/v1/knowledge/documents/${id}`, base({ method: "DELETE" })),

    // ── chat / triage ──
    chat: (body: {
      message: string;
      session_id?: string;
      external_thread_id?: string;
      contact?: { full_name?: string; phone?: string; email?: string; instagram_handle?: string };
    }) => apiFetch<ChatResponse>("/api/v1/chat", base({ method: "POST", body })),
    getSession: (id: string) => apiFetch<SessionDetail>(`/api/v1/sessions/${id}`, base()),

    // ── overview ──
    getOverview: () => apiFetch<Overview>("/api/v1/overview", base()),
  };
}

export type Api = ReturnType<typeof createApi>;
