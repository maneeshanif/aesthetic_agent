"""FastAPI dependencies: DB session, current user, spa context, role guards."""

from __future__ import annotations

import uuid
from collections.abc import AsyncIterator
from dataclasses import dataclass

from fastapi import Depends, Header
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import ForbiddenError, UnauthorizedError
from app.core.security import TokenClaims, decode_supabase_jwt, rls_context
from app.db.database import SessionLocal


async def get_raw_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        yield session


async def get_current_user(authorization: str | None = Header(default=None)) -> TokenClaims:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise UnauthorizedError("Missing bearer token.", code="missing_token")
    token = authorization.split(" ", 1)[1].strip()
    return decode_supabase_jwt(token)


@dataclass(frozen=True)
class SpaContext:
    spa_id: uuid.UUID
    role: str
    user_id: uuid.UUID
    claims: TokenClaims


async def get_spa_context(
    claims: TokenClaims = Depends(get_current_user),
    x_spa_id: str | None = Header(default=None, alias="X-Spa-Id"),
) -> SpaContext:
    if not x_spa_id:
        raise ForbiddenError("X-Spa-Id header is required.", code="spa_header_missing")
    try:
        spa_id = uuid.UUID(x_spa_id)
    except ValueError as exc:
        raise ForbiddenError("X-Spa-Id is not a valid id.", code="spa_header_invalid") from exc
    if spa_id not in claims.spa_ids:
        raise ForbiddenError("You do not have access to this workspace.", code="spa_forbidden")
    role = claims.role_for(spa_id)
    if role is None:
        raise ForbiddenError("No role for this workspace.", code="role_missing")
    return SpaContext(spa_id=spa_id, role=role, user_id=claims.user_id, claims=claims)


async def get_db(
    ctx: SpaContext = Depends(get_spa_context),
) -> AsyncIterator[AsyncSession]:
    """A session already inside an RLS context bound to the caller's claims."""
    async with SessionLocal() as session, rls_context(session, ctx.claims, ctx.spa_id):
        yield session


def require_role(*roles: str):
    async def _guard(ctx: SpaContext = Depends(get_spa_context)) -> SpaContext:
        if ctx.role not in roles:
            raise ForbiddenError(
                f"Requires role: {' or '.join(roles)}.", code="insufficient_role"
            )
        return ctx

    return _guard
