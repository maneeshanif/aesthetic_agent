"""Orchestrates ``POST /api/v1/chat``: retrieve → reason → red-flag → persist.

Ties together the vector store, the triage agent, and the PMS adapter, and is the
single place that writes ``triage_sessions`` + upserts ``patients``.
"""

from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.models.orm import Spa, TriageSession
from app.models.schemas import ChatRequest, ChatResponse
from app.services.ai_service import TriageAgent, TriageInput
from app.services.pms.factory import get_pms_adapter
from app.services.vector_service import VectorService

_now = lambda: datetime.now(UTC)  # noqa: E731


async def _load_or_create_session(
    session: AsyncSession, spa_id: uuid.UUID, req: ChatRequest
) -> TriageSession:
    if req.session_id is not None:
        row = await session.scalar(
            select(TriageSession).where(
                TriageSession.id == req.session_id, TriageSession.spa_id == spa_id
            )
        )
        if row is None:
            raise NotFoundError("Session not found.", code="session_not_found")
        return row

    if req.external_thread_id:
        row = await session.scalar(
            select(TriageSession).where(
                TriageSession.spa_id == spa_id,
                TriageSession.external_thread_id == req.external_thread_id,
            )
        )
        if row is not None:
            return row

    row = TriageSession(
        spa_id=spa_id,
        channel=req.channel,
        status="active",
        external_thread_id=req.external_thread_id,
        messages=[],
        ai_transcript=[],
    )
    session.add(row)
    await session.flush()
    return row


async def handle_chat(
    session: AsyncSession,
    spa: Spa,
    req: ChatRequest,
    *,
    agent: TriageAgent,
    vector_service: VectorService,
) -> ChatResponse:
    ts = await _load_or_create_session(session, spa.id, req)

    messages = list(ts.messages or [])
    messages.append({"role": "user", "content": req.message, "ts": _now().isoformat()})

    retrieved = await vector_service.search(spa.id, req.message, limit=5)

    decision = await agent.run(
        TriageInput(
            message=req.message,
            history=messages,
            retrieved=retrieved,
            booking_url=spa.booking_url,
            spa_name=spa.name,
        )
    )

    booking_url: str | None = None
    if decision.decision == "book" and spa.booking_url:
        session_status, patient_status = "completed", "medically_cleared"
        booking_url = spa.booking_url
    elif decision.decision == "contraindicated":
        session_status, patient_status = "completed", "contraindication_flagged"
    else:
        session_status, patient_status = "qualifying", "qualifying"

    messages.append({"role": "assistant", "content": decision.reply, "ts": _now().isoformat()})

    step = {
        "step": len(ts.ai_transcript or []) + 1,
        "agent": "single_worker_triage",
        "action": decision.decision,
        "retrieved": retrieved,
        "rules_enforced": [f["rule"] for f in decision.medical_flags],
        "ts": _now().isoformat(),
    }
    transcript = list(ts.ai_transcript or [])
    transcript.append(step)

    ts.messages = messages
    ts.ai_transcript = transcript
    ts.status = session_status
    ts.last_message_at = _now()
    if booking_url:
        ts.booking_url_issued = booking_url

    # Upsert the lead through the PMS abstraction when we have something to record.
    patient_id = ts.patient_id
    contact = req.contact
    has_identity = bool(
        (contact and (contact.phone or contact.email or contact.full_name))
        or decision.requested_treatment
        or decision.medical_flags
    )
    if has_identity:
        adapter = get_pms_adapter(spa, session)
        data = {
            "channel": req.channel,
            "status": patient_status,
            "requested_treatment": decision.requested_treatment,
            "medical_flags": decision.medical_flags,
            "estimated_value": decision.estimated_value,
        }
        if contact:
            data.update(
                full_name=contact.full_name,
                phone=contact.phone,
                email=contact.email,
                instagram_handle=contact.instagram_handle,
            )
        patient = await adapter.upsert_patient(spa.id, data)
        patient_id = patient.id
        ts.patient_id = patient_id

    await session.flush()

    return ChatResponse(
        session_id=ts.id,
        reply=decision.reply,
        status=session_status,
        patient_status=patient_status,
        booking_url=booking_url,
        medical_flags=decision.medical_flags,
        reasoning=[step],
        patient_id=patient_id,
    )
