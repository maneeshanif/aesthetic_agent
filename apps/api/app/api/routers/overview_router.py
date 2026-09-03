"""Dashboard overview metrics."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import SpaContext, get_db, get_spa_context
from app.core.errors import NotFoundError
from app.models.orm import Spa
from app.models.schemas import OverviewOut
from app.services.overview_service import compute_overview

router = APIRouter(prefix="/api/v1", tags=["overview"])


@router.get("/overview", response_model=OverviewOut)
async def overview(
    ctx: SpaContext = Depends(get_spa_context),
    session: AsyncSession = Depends(get_db),
) -> OverviewOut:
    spa = await session.get(Spa, ctx.spa_id)
    if spa is None:
        raise NotFoundError("Workspace not found.")
    return await compute_overview(session, ctx.spa_id, spa.timezone)
