"""Supabase Auth admin operations (service-role). Isolated behind a Protocol so
routers depend on the capability, not the SDK — and tests inject a fake."""

from __future__ import annotations

import uuid
from typing import Protocol


class AuthAdmin(Protocol):
    async def invite_user(self, email: str) -> uuid.UUID: ...

    async def update_app_metadata(
        self, user_id: uuid.UUID, spa_ids: list[str], memberships: dict[str, str]
    ) -> None: ...


class SupabaseAuthAdmin:
    def __init__(self, client: object | None = None):
        self._client = client

    def _c(self):
        if self._client is None:
            from app.db.supabase_client import get_supabase

            self._client = get_supabase()
        return self._client

    async def invite_user(self, email: str) -> uuid.UUID:
        res = self._c().auth.admin.invite_user_by_email(email)
        return uuid.UUID(res.user.id)

    async def update_app_metadata(
        self, user_id: uuid.UUID, spa_ids: list[str], memberships: dict[str, str]
    ) -> None:
        self._c().auth.admin.update_user_by_id(
            str(user_id),
            {"app_metadata": {"spa_ids": spa_ids, "memberships": memberships}},
        )
