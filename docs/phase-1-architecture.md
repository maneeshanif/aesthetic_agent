# Phase 1 — Database Schema & Auth Architecture

> **Status: DRAFT skeleton (Commit 1).**
> This document is finalized *before* Commit 2. It must specify every Phase 1 table,
> its fields and purpose, primary/foreign keys, relationships, indexes/constraints,
> the full authentication/authorization flow, and how auth binds to the database
> (RLS) and the APIs — based strictly on Phase 1 requirements and the overall
> product architecture in `PHASES.md`.

## 1. Entities (to finalize)

- `spas` — tenant record
- `spa_members` — user ↔ spa membership + role
- `patients` — captured leads (InternalSupabaseAdapter target)
- `triage_sessions` — chat transcript + AI reasoning trace

## 2. Relationships (to finalize)

## 3. Indexes & constraints (to finalize)

## 4. Row Level Security (to finalize)

## 5. Authentication & authorization flow (to finalize)

## 6. Auth ↔ DB ↔ API binding (to finalize)

## 7. Fit with future phases (to finalize)
