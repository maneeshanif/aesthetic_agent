"""Supabase client factory (foundational infrastructure).

Provides a lazily-constructed service-role client for server-side operations
(auth admin, storage). Query/business usage lands in Commit 2.
"""

from __future__ import annotations

from functools import lru_cache

from supabase import Client, create_client

from app.core.settings import get_settings


@lru_cache
def get_supabase() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
