"""Select the PMS adapter for a tenant based on ``spas.pms_provider``."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.orm import Spa
from app.services.pms.base import BasePMSAdapter
from app.services.pms.supabase_adapter import InternalSupabaseAdapter


def get_pms_adapter(spa: Spa, session: AsyncSession) -> BasePMSAdapter:
    if spa.pms_provider == "internal":
        return InternalSupabaseAdapter(session)
    # Phases 3+ register nexhealth / boulevard / zenoti here.
    raise AppError(
        f"PMS provider '{spa.pms_provider}' is not available in this phase.",
        code="pms_provider_unsupported",
    )
