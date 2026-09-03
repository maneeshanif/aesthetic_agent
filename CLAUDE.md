# CLAUDE.md — Vespera AI

> Med-spa lead triage, clinical-protocol RAG checking, and (later) voice telephony.
> B2B SaaS, $750–$1,500/mo. This repo is built in **phases**. **Only Phase 1 is implemented here.**

---

## 1. Golden Rules

1. **Phase 1 ONLY.** Never implement Phase 2+ functionality (multi-agent orchestration, omnichannel inbox,
   external PMS adapters, outbound/inbound voice). You may *read* `PHASES.md` to respect architecture
   boundaries, data flow, and extension points — never to build ahead.
2. **Exactly 3 commits for Phase 1:**
   - **Commit 1 — Foundation:** project init, clean monorepo structure, config, dependencies, env setup,
     foundational files. No backend or frontend *features*.
   - **Commit 2 — Complete Backend + Tests:** only after the DB + auth design is finalized in
     `docs/phase-1-architecture.md`.
   - **Commit 3 — Complete Frontend + Tests.**
   Each commit is verified, then committed **and pushed**.
3. **Before Commit 2**, finalize and document (in `docs/phase-1-architecture.md`): every Phase 1 table,
   its fields + purpose, PK/FK, relationships, indexes/constraints, the full auth/authorization flow,
   and how auth binds to the DB (RLS) and the APIs. Base it strictly on Phase 1 requirements + the
   overall product architecture. No speculative tables.
4. **Tests are mandatory** for Commits 2 and 3. Real assertions only — no placeholder/fake tests.
   All tests pass before pushing.
5. **UI/UX is the highest priority.** Premium, production-ready, sellable. Not a hackathon prototype,
   not generic AI-slop. Follow `design.md` (Vespera AI design system) as the design foundation.

---

## 2. Product Scope — Phase 1

**Multi-Tenant MVP & the Universal PMS Layer.** Focus: foundation, data isolation, baseline AI triage worker.

| Area | Phase 1 deliverable |
| --- | --- |
| Multi-tenant DB & RLS | `spas`, `spa_members`, `patients`, `triage_sessions` in Supabase Postgres. RLS on every table keyed by `spa_id` derived from the Supabase JWT. |
| Universal PMS Adapter | `BasePMSAdapter` interface + `InternalSupabaseAdapter` (default) writing leads to the local `patients` table. |
| RAG Knowledge Ingestion | Dashboard Settings → Knowledge page uploads "Treatment Menu & Protocol Rules" (PDF/Markdown). API chunks with `RecursiveCharacterTextSplitter` and stores embeddings in Qdrant, tagged by `spa_id`. |
| Single-Worker Triage Agent | `POST /api/v1/chat`. Gemini 2.0 Flash retrieves pricing/safety rules from Qdrant, checks red flags, returns a direct booking link. |
| Chat Tester | `/dashboard/chat-tester` — Instagram-DM-style sandbox + live reasoning/retrieval inspector. |
| CRM | `/dashboard/patients` — data table of every lead who talked to the bot. |
| Settings | `/dashboard/settings` — public booking URL + API keys. |
| Team | `/dashboard/team` — view/invite staff (Owner only). |
| Overview | `/dashboard` — leads captured, AI conversations, booking click-through. |
| Public | `/` landing page, `/login`, `/register` (tenant creation). |

### RBAC (Phase 1)

| Role | Routes | Actions |
| --- | --- | --- |
| **owner** | all | invite staff, view leads, upload/delete knowledge, edit settings, test AI |
| **manager** | all except `/dashboard/team` | view leads, upload/update knowledge, test AI |
| **front_desk** | `/dashboard`, `/dashboard/patients`, `/dashboard/chat-tester` | read-only CRM, test AI |

---

## 3. Architecture & Stack

- **Frontend:** `apps/web` — Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, Zustand,
  React Hook Form + Zod, GSAP, Lucide + bespoke SVG icons.
- **Backend:** `apps/api` — FastAPI (Python 3.11+), Pydantic v2, SQLAlchemy 2.0 (async) / Supabase client,
  Qdrant client, Google Gemini (`google-genai`).
- **DB & Auth:** Supabase (Postgres + RLS + Auth). JWT carries `spa_id` + `role` via app metadata.
- **Vector DB:** Qdrant (local via docker-compose in dev).
- **Agent engine:** Gemini 2.0 Flash (single worker — Phase 1 only).
- **Shared:** `apps/shared-types` — TS interfaces mirrored from API schemas.
- **Local dev:** `docker-compose.yml` runs Qdrant (+ optionally api/web).

### Abstraction layers (respect, don't extend)

- `BasePMSAdapter` — Phase 1 ships `InternalSupabaseAdapter` only. NexHealth/Boulevard/Zenoti are Phase 3.
- `BaseVoiceAdapter` — not in Phase 1 at all.

---

## 4. Repo Layout

```
apps/
  api/            FastAPI backend (Phase 1)
    app/
      api/routers/     auth, chat, knowledge, patient, tenant
      core/            settings, security, dependencies
      db/              database session + supabase client
      models/          SQLAlchemy models + Pydantic schemas
      services/
        pms/           base.py (BasePMSAdapter) + supabase_adapter.py
        ai_service.py       Gemini prompt build + execution
        vector_service.py   Qdrant chunk/embed/retrieve
      main.py
    tests/
    migrations/       SQL migrations (Supabase) incl. RLS policies
  web/            Next.js 14 frontend (Phase 1)
    app/ (public) (auth) (dashboard)
    components/ ui/ layout/ domain/
    lib/ supabase/ api-client.ts
    store/         Zustand
    __tests__/
  shared-types/   shared TS interfaces
docs/
  phase-1-architecture.md   DB schema + relationships + auth (finalized before Commit 2)
```

---

## 5. Commands

```bash
# Frontend (apps/web)
pnpm --filter web dev
pnpm --filter web build
pnpm --filter web test
pnpm --filter web lint

# Backend (apps/api)  — from apps/api with venv active
uvicorn app.main:app --reload
pytest
ruff check .

# Infra
docker compose up -d        # Qdrant
```

---

## 6. Conventions

- **Tenant isolation is non-negotiable.** Every API query runs under an RLS context bound to the caller's
  `spa_id`. Never accept `spa_id` from the request body — always derive it from the verified JWT.
- **Roles** live in `spa_members.role` and are mirrored into JWT app metadata for fast checks.
- Backend: routers thin, services fat. Validation via Pydantic v2. Errors via a single exception handler
  returning `{ "error": { "code", "message" } }`.
- Frontend: Server Components by default; `"use client"` only when needed. Data via `lib/api-client.ts`.
  UI state in Zustand; form state in React Hook Form. Design tokens from `design.md` only.
- Commits: Conventional Commits. Push after each of the 3 Phase 1 commits.

---

## 7. Design System — see `design.md`

Brand **Vespera AI**. Palette "Alabaster & Champagne Silk" (warm alabaster `#FAF8F5`, pearl, Tuscan linen,
burnished champagne gold `#D4A373`, silk rose `#E8C5B0`, espresso basalt text `#1A1715`, sage `#5E826D`,
terracotta rose `#A65B5B`). Display serif (Instrument Serif) + Plus Jakarta Sans UI + JetBrains Mono numerics.
No centered generic hero. No 50/50 text+image split. GSAP micro-physics + glassmorphic depth throughout.
The voice-agent / triage experience is the visual centerpiece.

---

## 8. Status

- [x] Docs reviewed (PHASES.md, phase_1.md, design.md, progress.md)
- [x] Commit 1 — Foundation (monorepo, config, deps, env, scaffold; web+api test/lint/build green)
- [x] `docs/phase-1-architecture.md` finalized (5 tables, RLS, auth flow, API surface)
- [x] Commit 2 — Backend + tests (68 pytest passing, ruff clean, ~90% coverage)
- [x] Commit 3 — Frontend + tests (landing + auth + 6 dashboard pages; 28 vitest passing; typecheck/lint/build green)
