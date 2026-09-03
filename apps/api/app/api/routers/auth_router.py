"""Post-login reconciliation of membership status and JWT claims."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.providers import get_auth_admin
from app.core.dependencies import get_current_user, get_raw_session
from app.core.security import TokenClaims
from app.models.schemas import AuthSyncOut
from app.services.auth_admin import AuthAdmin
from app.services.membership_service import activate_invited, sync_user_claims

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/sync", response_model=AuthSyncOut)
async def sync(
    claims: TokenClaims = Depends(get_current_user),
    session: AsyncSession = Depends(get_raw_session),
    auth_admin: AuthAdmin = Depends(get_auth_admin),
) -> AuthSyncOut:
    activated = await activate_invited(session, claims.user_id)
    spa_ids, memberships = await sync_user_claims(session, auth_admin, claims.user_id)
    await session.commit()
    return AuthSyncOut(
        user_id=claims.user_id,
        spa_ids=[uuid.UUID(s) for s in spa_ids],
        memberships=memberships,
        activated=activated,
    )
