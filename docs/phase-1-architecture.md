# Phase 1 — Database Schema & Auth Architecture

**Status: FINALIZED (pre–Commit 2).**
Scope: only what Phase 1 requires — multi-tenant data isolation, the built-in CRM
(`InternalSupabaseAdapter`), RAG knowledge ingestion, and the single-worker triage
agent. Structured so Phases 2–5 extend it without breaking changes.

---

## 1. Overview

```
auth.users (Supabase Auth)
     │  1        ┌──────────────────────────────────────────────┐
     └───────────┤ spa_members ├─────────────┐                  │
                 │  role, status             │ N                │ N
                 │                           ▼ 1                 ▼ 1
                 │                        ┌───────┐         (invited_by / uploaded_by
                 └────────────────────────┤ spas  ├───┐      = auth.users FKs)
                                    1     └───────┘   │
                        ┌───────────────────┼─────────┼───────────────┐
                        │ N                 │ N       │ N             │ N
                        ▼                   ▼         ▼               ▼
                   ┌──────────┐     ┌───────────────┐ ┌────────────────────┐
                   │ patients │◄────┤ triage_sessions│ │ knowledge_documents│
                   └──────────┘  0..1└───────────────┘ └────────────────────┘
                     (patient_id, nullable, ON DELETE SET NULL)
```

Every domain row carries a non-null `spa_id`. Tenant isolation is enforced in **two
layers**: Postgres Row Level Security (defence in depth) *and* the API query layer
(every statement runs inside an RLS context bound to the caller's verified claims).

`spa_id` is **never** read from a request body — only from the verified JWT
(`app_metadata.spa_ids`) cross-checked with the `X-Spa-Id` header.

---

## 2. Tables

### 2.1 `spas` — tenant / clinic

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, `default gen_random_uuid()` | Tenant identifier; the `spa_id` used everywhere. |
| `name` | `text` | `not null`, `check (char_length(name) between 1 and 120)` | Studio display name ("Sterling Aesthetics"). |
| `slug` | `text` | `not null`, `unique`, `check (slug ~ '^[a-z0-9-]{2,48}$')` | URL-safe handle for the tenant switcher. |
| `booking_url` | `text` | `null`, `check (booking_url is null or booking_url ~* '^https?://')` | Public Boulevard/NexHealth/Zenoti scheduling link the agent hands out. |
| `timezone` | `text` | `not null`, `default 'America/New_York'` | IANA tz for "after-hours" classification on the dashboard. |
| `pms_provider` | `text` | `not null`, `default 'internal'`, `check (pms_provider in ('internal'))` | Which `BasePMSAdapter` implementation to use. Phase 1 ships `internal` only; Phase 3 migration widens the check to add `nexhealth`/`boulevard`/`zenoti`. |
| `status` | `text` | `not null`, `default 'active'`, `check (status in ('active','suspended'))` | Tenant lifecycle. |
| `created_at` | `timestamptz` | `not null`, `default now()` | |
| `updated_at` | `timestamptz` | `not null`, `default now()` | Maintained by `set_updated_at()` trigger. |

Indexes: PK on `id`; unique on `slug`.

### 2.2 `spa_members` — membership + RBAC

Join table between `auth.users` and `spas`; also the Phase 1 invite record
(status `invited` until the user completes sign-up).

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, `default gen_random_uuid()` | |
| `spa_id` | `uuid` | `not null`, FK → `spas(id) ON DELETE CASCADE` | Tenant. |
| `user_id` | `uuid` | `not null`, FK → `auth.users(id) ON DELETE CASCADE` | Member. Supabase `inviteUserByEmail` creates the auth row immediately, so this is always populated. |
| `role` | `text` | `not null`, `check (role in ('owner','manager','front_desk'))` | RBAC role for this tenant. |
| `status` | `text` | `not null`, `default 'active'`, `check (status in ('active','invited','disabled'))` | `invited` → set to `active` on first authenticated `POST /auth/sync`. |
| `invited_email` | `text` | `null` | Email the invite was sent to (display before profile exists). |
| `invited_by` | `uuid` | `null`, FK → `auth.users(id) ON DELETE SET NULL` | Owner who sent the invite. |
| `created_at` | `timestamptz` | `not null`, `default now()` | |
| `updated_at` | `timestamptz` | `not null`, `default now()` | trigger-maintained. |

Constraints / indexes:
- `unique (spa_id, user_id)` — one membership per user per tenant.
- Partial unique index `uniq_spa_single_owner_bootstrap` is **not** used (multiple owners allowed).
- Index `idx_spa_members_user` on `(user_id)` — resolve "my tenants" fast during `/auth/sync`.
- Index `idx_spa_members_spa` on `(spa_id, role)`.

### 2.3 `patients` — captured leads (CRM / `InternalSupabaseAdapter` target)

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, `default gen_random_uuid()` | |
| `spa_id` | `uuid` | `not null`, FK → `spas(id) ON DELETE CASCADE` | Tenant. |
| `full_name` | `text` | `null` | Lead name (CRM column). |
| `phone` | `text` | `null`, `check (phone is null or phone ~ '^\+?[0-9 ().-]{7,20}$')` | Primary dedupe key. |
| `email` | `text` | `null`, `check (email is null or email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')` | Secondary dedupe key. |
| `instagram_handle` | `text` | `null` | CRM column ("Insta Handle"). |
| `channel` | `text` | `not null`, `default 'chat_tester'`, `check (channel in ('chat_tester','instagram','web','voice'))` | Origin. Phase 1 writes `chat_tester`; others reserved for Phases 3–5 (values pre-seeded to avoid a check migration). |
| `requested_treatment` | `text` | `null` | "Requested Treatment" CRM column. |
| `status` | `text` | `not null`, `default 'new'`, `check (status in ('new','qualifying','medically_cleared','contraindication_flagged','booked','abandoned'))` | Triage lifecycle / CRM status column. |
| `medical_flags` | `jsonb` | `not null`, `default '[]'::jsonb` | Array of `{rule, detail, source_chunk_id}` contraindications the agent raised. |
| `estimated_value` | `numeric(10,2)` | `null`, `check (estimated_value is null or estimated_value >= 0)` | "Est. Value" CRM column. |
| `notes` | `text` | `null` | Free-text follow-up notes (front-desk). |
| `created_at` | `timestamptz` | `not null`, `default now()` | |
| `updated_at` | `timestamptz` | `not null`, `default now()` | trigger-maintained. |

Indexes / constraints:
- `idx_patients_spa_created` on `(spa_id, created_at desc)` — default CRM sort + pagination.
- `idx_patients_spa_status` on `(spa_id, status)` — status filter.
- `uniq_patients_spa_phone` — unique on `(spa_id, phone)` `where phone is not null` — supports `upsert_patient()` by phone.
- `uniq_patients_spa_email` — unique on `(spa_id, lower(email))` `where email is not null` — fallback upsert key.
- `idx_patients_spa_name_trgm` — GIN `pg_trgm` on `(full_name)` scoped queries — CRM search bar.

**Upsert rule (`InternalSupabaseAdapter.upsert_patient`)**: match within `spa_id` on
`phone` → else `email` → else insert. Never merges across tenants (keys are composite with `spa_id`).

### 2.4 `triage_sessions` — conversation transcript + reasoning trace

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, `default gen_random_uuid()` | Also the `session_id` returned to the chat client. |
| `spa_id` | `uuid` | `not null`, FK → `spas(id) ON DELETE CASCADE` | Tenant. |
| `patient_id` | `uuid` | `null`, FK → `patients(id) ON DELETE SET NULL` | Linked once the lead is identified. Nullable — a session can begin anonymously. |
| `channel` | `text` | `not null`, `default 'chat_tester'`, `check (... same set as patients.channel)` | |
| `status` | `text` | `not null`, `default 'active'`, `check (status in ('active','qualifying','completed','abandoned','error'))` | Session lifecycle. `qualifying` > 2h is the Phase 4 abandoned-lead trigger (not implemented now, but the state exists). |
| `external_thread_id` | `text` | `null` | Client-supplied stable id for the chat-tester (resume); Instagram thread id in Phase 3. Index below. |
| `messages` | `jsonb` | `not null`, `default '[]'::jsonb` | Ordered `[{role:'user'\|'assistant'\|'system', content, ts}]`. |
| `ai_transcript` | `jsonb` | `not null`, `default '[]'::jsonb` | Ordered reasoning steps: `[{step, agent, action, retrieved:[{chunk_id, score, source}], rules_enforced:[...], ts}]`. Phase 2 appends multi-agent tool calls to the same column. |
| `booking_url_issued` | `text` | `null` | The link the agent handed out (drives "booking click-through"). |
| `last_message_at` | `timestamptz` | `null` | For ordering the live stream + abandonment checks. |
| `created_at` | `timestamptz` | `not null`, `default now()` | |
| `updated_at` | `timestamptz` | `not null`, `default now()` | trigger-maintained. |

Indexes:
- `idx_sessions_spa_created` on `(spa_id, created_at desc)` — dashboard live stream.
- `idx_sessions_spa_status` on `(spa_id, status)`.
- `idx_sessions_patient` on `(patient_id)`.
- `uniq_sessions_spa_thread` — unique on `(spa_id, external_thread_id)` `where external_thread_id is not null`.

### 2.5 `knowledge_documents` — RAG upload metadata

> **Why this table is in Phase 1.** The Phase 1 spec (`phase_1.md` §Knowledge Base
> view, `design.md` §RAG Engine Room) mandates a document list showing *extraction
> status, chunk count, embedding health,* and a *Delete/Replace* action. The
> embeddings live in Qdrant, but that per-document lifecycle state must live in
> Postgres. The `PHASES.md` table list ("spas, spa_members, patients,
> triage_sessions") is illustrative of the tenancy core, not exhaustive of Phase 1.

| Column | Type | Constraints | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | PK, `default gen_random_uuid()` | Also the Qdrant payload key `document_id`. |
| `spa_id` | `uuid` | `not null`, FK → `spas(id) ON DELETE CASCADE` | Tenant; also the Qdrant payload filter key. |
| `filename` | `text` | `not null` | Original upload name. |
| `file_type` | `text` | `not null`, `check (file_type in ('pdf','markdown'))` | Accepted RAG source types. |
| `storage_path` | `text` | `null` | Supabase Storage object path for the original file (bucket `knowledge`, prefixed `spa_id/`). |
| `byte_size` | `bigint` | `null`, `check (byte_size is null or byte_size >= 0)` | |
| `status` | `text` | `not null`, `default 'uploaded'`, `check (status in ('uploaded','chunking','embedded','failed'))` | Ingestion pipeline state shown in the UI. |
| `chunk_count` | `integer` | `not null`, `default 0`, `check (chunk_count >= 0)` | Number of chunks embedded into Qdrant. |
| `error_message` | `text` | `null` | Populated when `status = 'failed'`. |
| `uploaded_by` | `uuid` | `null`, FK → `auth.users(id) ON DELETE SET NULL` | |
| `created_at` | `timestamptz` | `not null`, `default now()` | |
| `updated_at` | `timestamptz` | `not null`, `default now()` | trigger-maintained. |
| `embedded_at` | `timestamptz` | `null` | Set when ingestion completes. |

Index: `idx_knowledge_spa_created` on `(spa_id, created_at desc)`.

### 2.6 Shared DB objects

```sql
create extension if not exists pg_trgm;

create or replace function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;
-- BEFORE UPDATE trigger on: spas, spa_members, patients, triage_sessions, knowledge_documents
```

---

## 3. Relationships summary

| From | To | Cardinality | On delete |
| --- | --- | --- | --- |
| `spa_members.spa_id` | `spas.id` | many-to-one | CASCADE |
| `spa_members.user_id` | `auth.users.id` | many-to-one | CASCADE |
| `spa_members.invited_by` | `auth.users.id` | many-to-one | SET NULL |
| `patients.spa_id` | `spas.id` | many-to-one | CASCADE |
| `triage_sessions.spa_id` | `spas.id` | many-to-one | CASCADE |
| `triage_sessions.patient_id` | `patients.id` | many-to-one (0..1) | SET NULL |
| `knowledge_documents.spa_id` | `spas.id` | many-to-one | CASCADE |
| `knowledge_documents.uploaded_by` | `auth.users.id` | many-to-one | SET NULL |

A user ↔ spa is many-to-many *through* `spa_members`, carrying `role`.

---

## 4. Vector store (Qdrant) — not a Postgres table, documented for completeness

- Single collection `vespera_knowledge`, cosine distance, dim = 768 (`text-embedding-004`).
- Every point payload: `{ spa_id, document_id, chunk_index, text, source_filename }`.
- **Every** query filters `must: [{ key: "spa_id", match: { value: <resolved spa_id> } }]`.
- Delete document → `delete(points_selector=Filter(must=[spa_id, document_id]))`.
- Chunking: `RecursiveCharacterTextSplitter`, ~1000 chars, 150 overlap.

---

## 5. Authentication

### 5.1 Provider & session

- **Supabase Auth**, email/password. Browser uses `@supabase/ssr` (`createBrowserClient`
  / `createServerClient`) — session in HTTP-only cookies, refreshed in Next.js middleware.
- The FastAPI backend is stateless: it **verifies** the Supabase access token
  (JWT, HS256, secret = `SUPABASE_JWT_SECRET`) on every request. Checks: signature,
  `exp`, `aud = "authenticated"`. Extracts `sub` (user id), `email`, `app_metadata`.

### 5.2 Claims model

Custom authorization data lives in the user's **`app_metadata`** (embedded in the JWT
by Supabase, writable only with the service role):

```jsonc
"app_metadata": {
  "spa_ids": ["8f3a…", "b21c…"],                       // every active membership
  "memberships": { "8f3a…": "owner", "b21c…": "manager" }
}
```

The **active** tenant is a client choice (tenant switcher → Zustand `activeSpaId`),
sent per request as the `X-Spa-Id` header. The backend authorizes as:

```
resolved_spa_id = X-Spa-Id  ⟺  X-Spa-Id ∈ token.app_metadata.spa_ids   (else 403)
resolved_role   = token.app_metadata.memberships[resolved_spa_id]
```

`app_metadata` is refreshed by the backend (service role) whenever membership changes
(register, invite accepted, role change). The client then calls
`supabase.auth.refreshSession()` to pull new claims.

### 5.3 Flows

**A. Register (new owner + tenant)**
1. Browser: `supabase.auth.signUp({ email, password })` → session established.
2. Browser: `POST /api/v1/tenant` `{ name, slug, timezone }` with the new JWT.
3. Backend (service role, RLS-bypassing, single transaction):
   - insert `spas`
   - insert `spa_members` (`role = 'owner'`, `status = 'active'`)
   - `auth.admin.update_user_by_id(sub, app_metadata += { spa_ids, memberships })`
4. Backend returns the spa. Browser calls `refreshSession()`, routes to `/dashboard`.

**B. Login** — `supabase.auth.signInWithPassword`. Middleware refreshes the cookie
session. `(dashboard)/layout.tsx` (server) reads claims; if `spa_ids` empty → redirect
to `/register` (create-tenant step). First authenticated call hits `POST /api/v1/auth/sync`
(idempotent) which flips any `invited` membership for this user to `active` and
re-syncs `app_metadata`.

**C. Invite teammate (owner only)**
1. `POST /api/v1/tenant/members` `{ email, role }` (role ∈ manager|front_desk; owner allowed).
2. Backend (service role): `auth.admin.invite_user_by_email(email, redirect_to=/login)`
   → `user_id`; insert `spa_members` (`status='invited'`, `invited_by=sub`,
   `invited_email=email`); add spa to that user's `app_metadata`.
3. Invitee sets a password via the email link, logs in, `POST /auth/sync` activates
   the membership.

**D. Token expiry** — access tokens ~1h; `@supabase/ssr` middleware refreshes silently.
Backend returns `401 { error: { code: "http_401" } }` on invalid/expired tokens; the
api-client surfaces it and the app redirects to `/login`.

---

## 6. Authorization (RBAC) — three enforcement points

| Layer | Mechanism |
| --- | --- |
| **Route (web)** | `(dashboard)/layout.tsx` requires an active membership. `/dashboard/team` requires `owner`; `/dashboard/settings` + `/settings/knowledge` require `owner`\|`manager`. Enforced in Server Components before render; client nav also hides links. |
| **API (FastAPI)** | Dependencies: `get_current_user` (verify JWT) → `get_spa_context` (resolve `spa_id`+`role` from header∩claims) → `require_role("owner", …)` per route. |
| **Database (RLS)** | Policies below. Even with a correct JWT, a query can only touch rows for `spa_id ∈ auth.spa_ids()`, and privileged writes re-check role. |

### 6.1 Role → capability matrix (Phase 1)

| Capability | owner | manager | front_desk |
| --- | --- | --- | --- |
| View overview / patients / sessions | ✅ | ✅ | ✅ |
| Use chat-tester (`POST /chat`) | ✅ | ✅ | ✅ |
| Update patient status / notes | ✅ | ✅ | ❌ |
| Upload / delete knowledge docs | ✅ | ✅ | ❌ |
| Edit tenant settings (booking URL, name, tz) | ✅ | ✅ | ❌ |
| Invite / remove / re-role members | ✅ | ❌ | ❌ |

### 6.2 RLS

```sql
-- Helpers read the verified claims Supabase/Backend put on the connection.
create or replace function auth.spa_ids() returns uuid[]
language sql stable as $$
  select coalesce(array(
    select jsonb_array_elements_text(
      coalesce(auth.jwt() -> 'app_metadata' -> 'spa_ids', '[]'::jsonb)
    )::uuid
  ), '{}'::uuid[]);
$$;

create or replace function auth.spa_role(target uuid) returns text
language sql stable as $$
  select auth.jwt() -> 'app_metadata' -> 'memberships' ->> target::text;
$$;

-- Every table: enable + force RLS.
alter table spas               enable row level security;
alter table spa_members        enable row level security;
alter table patients           enable row level security;
alter table triage_sessions    enable row level security;
alter table knowledge_documents enable row level security;

-- spas
create policy spas_select on spas for select
  using (id = any (auth.spa_ids()));
create policy spas_update on spas for update
  using (auth.spa_role(id) in ('owner','manager'))
  with check (auth.spa_role(id) in ('owner','manager'));
-- INSERT/DELETE of spas: service role only (backend bootstrap) → no policy.

-- spa_members
create policy members_select on spa_members for select
  using (spa_id = any (auth.spa_ids()));
create policy members_write on spa_members for all
  using (auth.spa_role(spa_id) = 'owner')
  with check (auth.spa_role(spa_id) = 'owner');

-- patients
create policy patients_select on patients for select
  using (spa_id = any (auth.spa_ids()));
create policy patients_insert on patients for insert
  with check (spa_id = any (auth.spa_ids()));           -- agent runs as the member
create policy patients_update on patients for update
  using (auth.spa_role(spa_id) in ('owner','manager'))
  with check (auth.spa_role(spa_id) in ('owner','manager'));

-- triage_sessions  (any member may read/append; agent writes on their behalf)
create policy sessions_select on triage_sessions for select
  using (spa_id = any (auth.spa_ids()));
create policy sessions_write on triage_sessions for all
  using (spa_id = any (auth.spa_ids()))
  with check (spa_id = any (auth.spa_ids()));

-- knowledge_documents
create policy knowledge_select on knowledge_documents for select
  using (spa_id = any (auth.spa_ids()));
create policy knowledge_write on knowledge_documents for all
  using (auth.spa_role(spa_id) in ('owner','manager'))
  with check (auth.spa_role(spa_id) in ('owner','manager'));
```

---

## 7. Auth ↔ DB ↔ API binding

```
Browser ──JWT (cookie)──▶ Next.js middleware/RSC ──Bearer JWT + X-Spa-Id──▶ FastAPI
                                                                             │
                          verify JWT (SUPABASE_JWT_SECRET, aud=authenticated)│
                          resolve spa_id = X-Spa-Id ∩ claims.spa_ids         │
                          resolve role   = claims.memberships[spa_id]        │
                                                                             ▼
                       ┌─────────────────────────────────────────────────────────┐
                       │ async SQLAlchemy session, per-request transaction:       │
                       │   SET LOCAL role = 'authenticated';                      │
                       │   SET LOCAL request.jwt.claims = :verified_claims_json;  │
                       │   … ORM queries …  (RLS now applies exactly as PostgREST)│
                       └─────────────────────────────────────────────────────────┘

Service-role Supabase client (RLS-bypassing) is used ONLY for:
  • auth admin: invite_user_by_email, update_user_by_id (app_metadata)
  • Storage: put/delete the original knowledge files
  • tenant bootstrap insert in POST /api/v1/tenant (before the user has any claims)
```

- `core/security.py`: `decode_supabase_jwt(token) -> TokenClaims`, and
  `rls_context(session, claims)` async context manager issuing the two `SET LOCAL`s.
- `core/dependencies.py`: `get_current_user`, `get_spa_context` (→ `SpaContext{spa_id, role, user_id}`),
  `require_role(*roles)`, `get_db` (yields a session already inside `rls_context`).
- The `DATABASE_URL` role must be allowed to `SET ROLE authenticated` (Supabase `postgres` role qualifies).

### Phase 1 API surface (implemented in Commit 2)

| Method & path | Role | Notes |
| --- | --- | --- |
| `GET /api/v1/health` | public | liveness |
| `POST /api/v1/tenant` | any authed, no membership yet | create spa + owner; service-role bootstrap |
| `GET /api/v1/tenant` | member | active spa settings |
| `PATCH /api/v1/tenant` | owner, manager | booking_url, name, timezone |
| `POST /api/v1/auth/sync` | authed | activate invited membership, resync claims |
| `GET /api/v1/tenant/members` | member | roster |
| `POST /api/v1/tenant/members` | owner | invite |
| `PATCH /api/v1/tenant/members/{id}` | owner | change role / disable |
| `DELETE /api/v1/tenant/members/{id}` | owner | remove (not self if last owner) |
| `GET /api/v1/patients` | member | pagination, `q` search, `status` filter |
| `GET /api/v1/patients/{id}` | member | detail + linked sessions |
| `PATCH /api/v1/patients/{id}` | owner, manager | status, notes, estimated_value |
| `GET /api/v1/knowledge/documents` | member | list + ingestion status |
| `POST /api/v1/knowledge/documents` | owner, manager | multipart upload → chunk → embed → Qdrant |
| `DELETE /api/v1/knowledge/documents/{id}` | owner, manager | delete row + Qdrant points + storage object |
| `POST /api/v1/chat` | member | single-worker triage: retrieve → red-flag → reply + booking link; persists session + upserts patient |
| `GET /api/v1/sessions/{id}` | member | transcript + reasoning (chat-tester inspector, CRM row expansion) |
| `GET /api/v1/overview` | member | dashboard metrics (leads, conversations, booking CTR, after-hours, flag rate) |

---

## 8. Fit with future phases

| Future need | Already accommodated |
| --- | --- |
| Multi-agent orchestration (P2) | `triage_sessions.ai_transcript` is an append-only JSON log; single worker uses the same shape. |
| Omnichannel inbox (P3) | `channel` enums pre-seed `instagram`/`web`; `external_thread_id` + `uniq (spa_id, external_thread_id)` ready for webhook dedupe. |
| Human takeover (P3) | add `triage_sessions.status = 'human_takeover'` (value add, no schema change) + Zustand `pausedSessions` already in `design.md`. |
| External PMS (P3) | `spas.pms_provider` + a future `pms_config jsonb`; `BasePMSAdapter` swap-in, `patients` stays the local mirror. |
| Outbound/inbound voice (P4/P5) | `channel = 'voice'` pre-seeded; `status = 'qualifying'` + `last_message_at` support the "> 2h" abandoned-lead Celery scan. |
| Analytics history | timestamps + status enums on every table; no destructive updates (status transitions only). |

No table added here is speculative: all five are required to ship the Phase 1
dashboard, CRM, RAG ingestion, and triage agent.
