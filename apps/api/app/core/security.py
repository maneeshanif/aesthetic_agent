"""Auth primitives — Supabase JWT decoding and RLS context.

Commit 1 scaffold: the full implementation (signature verification, claim
extraction of ``spa_id`` / ``role``, and per-request RLS context injection) lands
in Commit 2 once ``docs/phase-1-architecture.md`` finalizes the auth design.
"""

from __future__ import annotations

# TODO(Commit 2): implement decode_supabase_jwt(token) -> TokenClaims
# TODO(Commit 2): implement rls_context(session, spa_id) context manager that runs
#                 `SET LOCAL request.jwt.claims` / `SET LOCAL role` for Postgres RLS.
