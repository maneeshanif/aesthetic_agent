"""The Universal PMS abstraction.

Phase 1 ships one implementation (:class:`InternalSupabaseAdapter`). Phases 3+
add NexHealth/Boulevard/Zenoti adapters behind this same interface without
touching agent prompts or the ``patients`` table, which stays the local mirror.
"""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import Any

from app.models.orm import Patient


class BasePMSAdapter(ABC):
    """Contract every practice-management-system adapter fulfils."""

    provider: str = "base"

    @abstractmethod
    async def upsert_patient(self, spa_id: uuid.UUID, data: dict[str, Any]) -> Patient:
        """Create or update a lead within a tenant.

        Match precedence (never across tenants): ``phone`` → ``email`` → insert.
        ``data`` keys: full_name, phone, email, instagram_handle, channel,
        requested_treatment, status, medical_flags, estimated_value, notes.
        """

    @abstractmethod
    async def get_patient(self, spa_id: uuid.UUID, patient_id: uuid.UUID) -> Patient | None:
        """Fetch a single lead scoped to the tenant."""
