"""Phase 1 CRM: list, detail, and staff updates for captured leads."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import SpaContext, get_db, get_spa_context, require_role
from app.core.errors import NotFoundError
from app.models.orm import Patient, TriageSession
from app.models.schemas import (
    Page,
    PatientDetailOut,
    PatientOut,
    PatientUpdate,
    SessionSummary,
)

router = APIRouter(prefix="/api/v1/patients", tags=["patients"])

_STATUSES = {
    "new",
    "qualifying",
    "medically_cleared",
    "contraindication_flagged",
    "booked",
    "abandoned",
}


@router.get("", response_model=Page[PatientOut])
async def list_patients(
    ctx: SpaContext = Depends(get_spa_context),
    session: AsyncSession = Depends(get_db),
    q: str | None = Query(default=None, max_length=120),
    status: str | None = Query(default=None),
    limit: int = Query(default=25, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> Page[PatientOut]:
    filters = [Patient.spa_id == ctx.spa_id]
    if status and status in _STATUSES:
        filters.append(Patient.status == status)
    if q:
        like = f"%{q.lower()}%"
        filters.append(
            or_(
                func.lower(func.coalesce(Patient.full_name, "")).like(like),
                func.lower(func.coalesce(Patient.requested_treatment, "")).like(like),
                func.lower(func.coalesce(Patient.phone, "")).like(like),
                func.lower(func.coalesce(Patient.email, "")).like(like),
            )
        )

    total = await session.scalar(select(func.count()).select_from(Patient).where(*filters))
    rows = await session.scalars(
        select(Patient)
        .where(*filters)
        .order_by(Patient.created_at.desc())
        .limit(limit)
        .offset(offset)
    )
    return Page[PatientOut](
        items=[PatientOut.model_validate(r) for r in rows],
        total=total or 0,
        limit=limit,
        offset=offset,
    )


@router.get("/{patient_id}", response_model=PatientDetailOut)
async def get_patient(
    patient_id: uuid.UUID,
    ctx: SpaContext = Depends(get_spa_context),
    session: AsyncSession = Depends(get_db),
) -> PatientDetailOut:
    patient = await session.scalar(
        select(Patient).where(Patient.id == patient_id, Patient.spa_id == ctx.spa_id)
    )
    if patient is None:
        raise NotFoundError("Patient not found.")
    sessions = await session.scalars(
        select(TriageSession)
        .where(TriageSession.patient_id == patient_id, TriageSession.spa_id == ctx.spa_id)
        .order_by(TriageSession.created_at.desc())
    )
    return PatientDetailOut(
        **PatientOut.model_validate(patient).model_dump(),
        sessions=[SessionSummary.model_validate(s) for s in sessions],
    )


@router.patch("/{patient_id}", response_model=PatientOut)
async def update_patient(
    patient_id: uuid.UUID,
    body: PatientUpdate,
    ctx: SpaContext = Depends(require_role("owner", "manager")),
    session: AsyncSession = Depends(get_db),
) -> Patient:
    patient = await session.scalar(
        select(Patient).where(Patient.id == patient_id, Patient.spa_id == ctx.spa_id)
    )
    if patient is None:
        raise NotFoundError("Patient not found.")
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    await session.commit()
    await session.refresh(patient)
    return patient
