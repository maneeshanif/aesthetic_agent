"""Tenant settings + team management."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Response
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.providers import get_auth_admin
from app.core.dependencies import (
    SpaContext,
    get_current_user,
    get_db,
    get_raw_session,
    get_spa_context,
    require_role,
)
from app.core.errors import ConflictError, ForbiddenError, NotFoundError
from app.core.security import TokenClaims
from app.models.orm import Spa, SpaMember
from app.models.schemas import (
    MemberInvite,
    MemberOut,
    MemberUpdate,
    TenantCreate,
    TenantOut,
    TenantUpdate,
)
from app.services.auth_admin import AuthAdmin
from app.services.membership_service import sync_user_claims

router = APIRouter(prefix="/api/v1", tags=["tenant"])


@router.post("/tenant", response_model=TenantOut, status_code=201)
async def create_tenant(
    body: TenantCreate,
    claims: TokenClaims = Depends(get_current_user),
    session: AsyncSession = Depends(get_raw_session),
    auth_admin: AuthAdmin = Depends(get_auth_admin),
) -> Spa:
    exists = await session.scalar(select(Spa.id).where(Spa.slug == body.slug))
    if exists:
        raise ConflictError("That workspace URL is taken.", code="slug_taken")

    spa = Spa(name=body.name, slug=body.slug, timezone=body.timezone, pms_provider="internal")
    session.add(spa)
    await session.flush()

    session.add(
        SpaMember(spa_id=spa.id, user_id=claims.user_id, role="owner", status="active")
    )
    await session.flush()
    await sync_user_claims(session, auth_admin, claims.user_id)
    await session.commit()
    await session.refresh(spa)
    return spa


@router.get("/tenant", response_model=TenantOut)
async def get_tenant(
    ctx: SpaContext = Depends(get_spa_context),
    session: AsyncSession = Depends(get_db),
) -> Spa:
    spa = await session.get(Spa, ctx.spa_id)
    if spa is None:
        raise NotFoundError("Workspace not found.")
    return spa


@router.patch("/tenant", response_model=TenantOut)
async def update_tenant(
    body: TenantUpdate,
    ctx: SpaContext = Depends(require_role("owner", "manager")),
    session: AsyncSession = Depends(get_db),
) -> Spa:
    spa = await session.get(Spa, ctx.spa_id)
    if spa is None:
        raise NotFoundError("Workspace not found.")
    data = body.model_dump(exclude_unset=True)
    for key, value in data.items():
        setattr(spa, key, value)
    await session.commit()
    await session.refresh(spa)
    return spa


@router.get("/tenant/members", response_model=list[MemberOut])
async def list_members(
    ctx: SpaContext = Depends(get_spa_context),
    session: AsyncSession = Depends(get_db),
) -> list[SpaMember]:
    rows = await session.scalars(
        select(SpaMember).where(SpaMember.spa_id == ctx.spa_id).order_by(SpaMember.created_at)
    )
    return list(rows)


async def _count_active_owners(session: AsyncSession, spa_id: uuid.UUID) -> int:
    return await session.scalar(
        select(func.count())
        .select_from(SpaMember)
        .where(
            SpaMember.spa_id == spa_id,
            SpaMember.role == "owner",
            SpaMember.status == "active",
        )
    )


@router.post("/tenant/members", response_model=MemberOut, status_code=201)
async def invite_member(
    body: MemberInvite,
    ctx: SpaContext = Depends(require_role("owner")),
    session: AsyncSession = Depends(get_db),
    auth_admin: AuthAdmin = Depends(get_auth_admin),
) -> SpaMember:
    invitee_id = await auth_admin.invite_user(body.email)

    existing = await session.scalar(
        select(SpaMember).where(
            SpaMember.spa_id == ctx.spa_id, SpaMember.user_id == invitee_id
        )
    )
    if existing is not None:
        raise ConflictError("That person is already on the team.", code="already_member")

    member = SpaMember(
        spa_id=ctx.spa_id,
        user_id=invitee_id,
        role=body.role,
        status="invited",
        invited_email=body.email,
        invited_by=ctx.user_id,
    )
    session.add(member)
    await session.flush()
    # give the invitee the workspace in their claims immediately (status flips on sync)
    await sync_user_claims(session, auth_admin, invitee_id)
    await session.commit()
    await session.refresh(member)
    return member


@router.patch("/tenant/members/{member_id}", response_model=MemberOut)
async def update_member(
    member_id: uuid.UUID,
    body: MemberUpdate,
    ctx: SpaContext = Depends(require_role("owner")),
    session: AsyncSession = Depends(get_db),
    auth_admin: AuthAdmin = Depends(get_auth_admin),
) -> SpaMember:
    member = await session.scalar(
        select(SpaMember).where(
            SpaMember.id == member_id, SpaMember.spa_id == ctx.spa_id
        )
    )
    if member is None:
        raise NotFoundError("Member not found.")

    data = body.model_dump(exclude_unset=True)
    demoting_or_disabling = (
        data.get("role", member.role) != "owner" or data.get("status", member.status) != "active"
    )
    would_orphan = (
        member.role == "owner"
        and member.status == "active"
        and demoting_or_disabling
        and await _count_active_owners(session, ctx.spa_id) <= 1
    )
    if would_orphan:
        raise ForbiddenError(
            "A workspace must keep at least one active owner.", code="last_owner"
        )

    for key, value in data.items():
        setattr(member, key, value)
    await session.flush()
    await sync_user_claims(session, auth_admin, member.user_id)
    await session.commit()
    await session.refresh(member)
    return member


@router.delete("/tenant/members/{member_id}", status_code=204, response_model=None)
async def remove_member(
    member_id: uuid.UUID,
    ctx: SpaContext = Depends(require_role("owner")),
    session: AsyncSession = Depends(get_db),
    auth_admin: AuthAdmin = Depends(get_auth_admin),
) -> None:
    member = await session.scalar(
        select(SpaMember).where(
            SpaMember.id == member_id, SpaMember.spa_id == ctx.spa_id
        )
    )
    if member is None:
        raise NotFoundError("Member not found.")
    is_last_owner = (
        member.role == "owner"
        and member.status == "active"
        and await _count_active_owners(session, ctx.spa_id) <= 1
    )
    if is_last_owner:
        raise ForbiddenError(
            "A workspace must keep at least one active owner.", code="last_owner"
        )
    removed_user = member.user_id
    await session.delete(member)
    await session.flush()
    await sync_user_claims(session, auth_admin, removed_user)
    await session.commit()
    return Response(status_code=204)
