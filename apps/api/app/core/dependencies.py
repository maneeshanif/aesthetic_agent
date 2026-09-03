"""Shared FastAPI dependencies.

Commit 1 scaffold. Commit 2 adds: ``get_db`` (async session with RLS context),
``get_current_user`` (JWT -> principal), ``verify_spa_access`` / ``require_role``.
"""

from __future__ import annotations

# TODO(Commit 2): get_db, get_current_user, verify_spa_access, require_role(*roles)
