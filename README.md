# Vespera AI

**Med-spa lead triage, clinical-protocol RAG checking, and voice telephony.**
B2B SaaS that captures after-hours aesthetic leads, enforces medical-safety rules via RAG,
drives direct CRM bookings, and (later phases) recovers abandoned leads with voice agents.

> This repository implements **Phase 1** only. See [`PHASES.md`](./PHASES.md) for the full roadmap
> and [`CLAUDE.md`](./CLAUDE.md) for build rules.

---

## Monorepo

| Path | Stack | Purpose |
| --- | --- | --- |
| `apps/web` | Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, Zustand, GSAP | Dashboard + marketing site |
| `apps/api` | FastAPI (Python 3.11), Pydantic v2, Qdrant, Gemini 2.0 Flash | REST API, RAG ingestion, triage agent |
| `apps/shared-types` | TypeScript | Interfaces shared between web and api contracts |
| `docs/` | Markdown | `phase-1-architecture.md` — DB schema, relationships, auth |

## Phase 1 features

- Multi-tenant Supabase Postgres with Row Level Security (`spas`, `spa_members`, `patients`, `triage_sessions`)
- Universal PMS layer — `BasePMSAdapter` + `InternalSupabaseAdapter`
- RAG knowledge ingestion (PDF / Markdown → Qdrant, tagged by `spa_id`)
- Single-worker triage agent — `POST /api/v1/chat` (Gemini 2.0 Flash + Qdrant retrieval + red-flag checks)
- Dashboard: Overview, Patients CRM, Chat Tester, Knowledge Base, Settings, Team
- Auth: email/password via Supabase, multi-step tenant onboarding, RBAC (owner / manager / front_desk)

## Prerequisites

- Node.js ≥ 20.11 and pnpm ≥ 11
- Python 3.11
- Docker (for local Qdrant)
- A Supabase project and a Gemini API key

## Setup

```bash
# 1. Install JS deps
pnpm install

# 2. Environment
cp .env.example .env
cp .env.example apps/web/.env.local
cp .env.example apps/api/.env
# then fill in Supabase / Gemini / Qdrant values

# 3. Local infra (Qdrant)
docker compose up -d

# 4. Backend
cd apps/api
python -m venv .venv
# Windows:  .venv\Scripts\activate     |  macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload

# 5. Frontend (new terminal)
pnpm --filter web dev
```

Web runs on http://localhost:3000, API on http://localhost:8000 (docs at `/docs`).

## Tests

```bash
pnpm --filter web test        # Vitest + Testing Library
cd apps/api && pytest         # pytest
```

## Commit plan (Phase 1)

1. **Foundation** — structure, config, dependencies, env. *(this commit)*
2. **Backend + tests** — after `docs/phase-1-architecture.md` is finalized.
3. **Frontend + tests**.
