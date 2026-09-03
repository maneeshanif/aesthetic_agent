"""The single-worker triage endpoint + session inspection."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.providers import get_triage_agent, get_vector_service
from app.core.dependencies import SpaContext, get_db, get_spa_context
from app.core.errors import NotFoundError
from app.models.orm import Spa, TriageSession
from app.models.schemas import ChatRequest, ChatResponse, SessionOut
from app.services.ai_service import TriageAgent
from app.services.triage_service import handle_chat
from app.services.vector_service import VectorService

router = APIRouter(prefix="/api/v1", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(
    body: ChatRequest,
    ctx: SpaContext = Depends(get_spa_context),
    session: AsyncSession = Depends(get_db),
    agent: TriageAgent = Depends(get_triage_agent),
    vector_service: VectorService = Depends(get_vector_service),
) -> ChatResponse:
    spa = await session.get(Spa, ctx.spa_id)
    if spa is None:
        raise NotFoundError("Workspace not found.")
    result = await handle_chat(
        session, spa, body, agent=agent, vector_service=vector_service
    )
    await session.commit()
    return result


@router.get("/sessions/{session_id}", response_model=SessionOut)
async def get_session(
    session_id: uuid.UUID,
    ctx: SpaContext = Depends(get_spa_context),
    session: AsyncSession = Depends(get_db),
) -> TriageSession:
    row = await session.scalar(
        select(TriageSession).where(
            TriageSession.id == session_id, TriageSession.spa_id == ctx.spa_id
        )
    )
    if row is None:
        raise NotFoundError("Session not found.")
    return row
