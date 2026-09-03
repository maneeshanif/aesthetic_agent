"""Supabase JWT verification and the Postgres RLS context.

The backend is stateless: every request carries a Supabase access token which we
verify here (HS256, ``SUPABASE_JWT_SECRET``). Authorization data lives in the
token's ``app_metadata`` (``spa_ids`` + ``memberships``) — see
``docs/phase-1-architecture.md``.
"""

from __future__ import annotations

import json
import uuid
from contextlib import asynccontextmanager
from dataclasses import dataclass, field

import jwt
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnauthorizedError
from app.core.settings import get_settings


@dataclass(frozen=True)
class TokenClaims:
    user_id: uuid.UUID
    email: str | None
    spa_ids: list[uuid.UUID]
    memberships: dict[str, str]
    raw: dict = field(default_factory=dict, repr=False)

    def role_for(self, spa_id: uuid.UUID) -> str | None:
        return self.memberships.get(str(spa_id))


def decode_supabase_jwt(token: str) -> TokenClaims:
    settings = get_settings()
    if not settings.supabase_jwt_secret:
        raise UnauthorizedError("Auth is not configured.", code="auth_not_configured")
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError as exc:
        raise UnauthorizedError("Token has expired.", code="token_expired") from exc
    except jwt.InvalidTokenError as exc:
        raise UnauthorizedError("Invalid authentication token.", code="token_invalid") from exc

    app_meta = payload.get("app_metadata") or {}
    try:
        spa_ids = [uuid.UUID(str(s)) for s in app_meta.get("spa_ids", [])]
    except (ValueError, TypeError) as exc:
        raise UnauthorizedError("Malformed spa_ids claim.", code="token_invalid") from exc

    memberships_raw = app_meta.get("memberships", {}) or {}
    memberships = {str(k): str(v) for k, v in memberships_raw.items()}

    return TokenClaims(
        user_id=uuid.UUID(str(payload["sub"])),
        email=payload.get("email"),
        spa_ids=spa_ids,
        memberships=memberships,
        raw=payload,
    )


def build_rls_claims(claims: TokenClaims, active_spa_id: uuid.UUID | None) -> dict:
    """The JSON payload we hand Postgres as ``request.jwt.claims`` so RLS helper
    functions (``auth.spa_ids()`` / ``auth.spa_role()``) resolve correctly."""
    return {
        "sub": str(claims.user_id),
        "role": "authenticated",
        "email": claims.email,
        "app_metadata": {
            "spa_ids": [str(s) for s in claims.spa_ids],
            "memberships": claims.memberships,
        },
        "active_spa_id": str(active_spa_id) if active_spa_id else None,
    }


@asynccontextmanager
async def rls_context(session: AsyncSession, claims: TokenClaims, active_spa_id: uuid.UUID | None):
    """Bind the verified claims to the connection for the duration of a
    transaction so Postgres RLS applies exactly as it would via PostgREST.

    No-op semantics on SQLite (test suite): the ``SET LOCAL`` statements are
    skipped because tenant isolation there is proven at the query layer.
    """
    is_postgres = session.bind is not None and session.bind.dialect.name == "postgresql"
    if is_postgres:
        payload = json.dumps(build_rls_claims(claims, active_spa_id))
        await session.execute(text("SET LOCAL role = 'authenticated'"))
        await session.execute(
            text("SET LOCAL request.jwt.claims = :claims").bindparams(claims=payload)
        )
    try:
        yield session
    finally:
        # transaction close resets SET LOCAL automatically
        pass
