"""Object storage for original knowledge files (Supabase Storage bucket
``knowledge``, objects prefixed ``<spa_id>/``)."""

from __future__ import annotations

from typing import Protocol

BUCKET = "knowledge"


class Storage(Protocol):
    async def upload(self, path: str, data: bytes, content_type: str) -> str: ...

    async def delete(self, path: str) -> None: ...


class SupabaseStorage:
    def __init__(self, client: object | None = None):
        self._client = client

    def _c(self):
        if self._client is None:
            from app.db.supabase_client import get_supabase

            self._client = get_supabase()
        return self._client

    async def upload(self, path: str, data: bytes, content_type: str) -> str:
        self._c().storage.from_(BUCKET).upload(
            path, data, {"content-type": content_type, "upsert": "true"}
        )
        return path

    async def delete(self, path: str) -> None:
        self._c().storage.from_(BUCKET).remove([path])
