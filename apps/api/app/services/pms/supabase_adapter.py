"""Phase 1 default PMS adapter: stores leads in the local ``patients`` table."""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Patient
from app.services.pms.base import BasePMSAdapter

_MUTABLE_FIELDS = {
    "full_name",
    "phone",
    "email",
    "instagram_handle",
    "channel",
    "requested_treatment",
    "status",
    "medical_flags",
    "estimated_value",
    "notes",
}


class InternalSupabaseAdapter(BasePMSAdapter):
    provider = "internal"

    def __init__(self, session: AsyncSession):
        self._session = session

    async def _find_match(
        self, spa_id: uuid.UUID, phone: str | None, email: str | None
    ) -> Patient | None:
        if phone:
            row = await self._session.scalar(
                select(Patient).where(Patient.spa_id == spa_id, Patient.phone == phone)
            )
            if row:
                return row
        if email:
            row = await self._session.scalar(
                select(Patient).where(
                    Patient.spa_id == spa_id, Patient.email == email.lower()
                )
            )
            if row:
                return row
        return None

    async def upsert_patient(self, spa_id: uuid.UUID, data: dict[str, Any]) -> Patient:
        clean = {k: v for k, v in data.items() if k in _MUTABLE_FIELDS and v is not None}
        if "email" in clean and isinstance(clean["email"], str):
            clean["email"] = clean["email"].lower()

        existing = await self._find_match(spa_id, clean.get("phone"), clean.get("email"))
        if existing is not None:
            for key, value in clean.items():
                # don't blank an identified name/contact with a later anonymous turn
                setattr(existing, key, value)
            await self._session.flush()
            return existing

        patient = Patient(spa_id=spa_id, **clean)
        self._session.add(patient)
        await self._session.flush()
        return patient

    async def get_patient(self, spa_id: uuid.UUID, patient_id: uuid.UUID) -> Patient | None:
        return await self._session.scalar(
            select(Patient).where(Patient.id == patient_id, Patient.spa_id == spa_id)
        )
