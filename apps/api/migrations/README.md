# Migrations

SQL migrations for the Supabase Postgres database, applied in filename order.

Phase 1 migrations (added in Commit 2) create `spas`, `spa_members`, `patients`,
`triage_sessions`, their indexes/constraints, and the Row Level Security policies
keyed by `spa_id` from the Supabase JWT. See `docs/phase-1-architecture.md`.

Naming: `NNNN_description.sql` (e.g. `0001_init_tenancy.sql`).
