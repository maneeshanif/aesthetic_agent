"""Injectable providers for external services. Overridden in tests via
``app.dependency_overrides``."""

from __future__ import annotations

from app.services.ai_service import TriageAgent
from app.services.auth_admin import AuthAdmin, SupabaseAuthAdmin
from app.services.storage import Storage, SupabaseStorage
from app.services.vector_service import VectorService


def get_vector_service() -> VectorService:
    return VectorService.from_settings()


def get_triage_agent() -> TriageAgent:
    return TriageAgent.from_settings()


def get_auth_admin() -> AuthAdmin:
    return SupabaseAuthAdmin()


def get_storage() -> Storage:
    return SupabaseStorage()
