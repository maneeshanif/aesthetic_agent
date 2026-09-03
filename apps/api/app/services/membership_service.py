"""Membership + claims reconciliation shared by the auth and tenant routers."""

from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import SpaMember
from app.services.auth_admin import AuthAdmin


async def active_memberships(
    session: AsyncSession, user_id: uuid.UUID
) -> list[SpaMember]:
    rows = await session.scalars(
        select(SpaMember).where(
            SpaMember.user_id == user_id, SpaMember.status == "active"
        )
    )
    return list(rows)


async def sync_user_claims(
    session: AsyncSession, auth_admin: AuthAdmin, user_id: uuid.UUID
) -> tuple[list[str], dict[str, str]]:
    """Recompute ``app_metadata`` for a user from their active memberships and
    push it to Supabase so the next refreshed JWT carries the right claims."""
    members = await active_memberships(session, user_id)
    spa_ids = [str(m.spa_id) for m in members]
    memberships = {str(m.spa_id): m.role for m in members}
    await auth_admin.update_app_metadata(user_id, spa_ids, memberships)
    return spa_ids, memberships


async def activate_invited(session: AsyncSession, user_id: uuid.UUID) -> int:
    members = await session.scalars(
        select(SpaMember).where(
            SpaMember.user_id == user_id, SpaMember.status == "invited"
        )
    )
    count = 0
    for m in members:
        m.status = "active"
        count += 1
    if count:
        await session.flush()
    return count
