"""Application configuration, loaded from environment variables.

Foundational infrastructure (Commit 1). No business logic here.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ---- Environment ----
    api_env: str = Field(default="development")
    log_level: str = Field(default="INFO")
    cors_allow_origins: str = Field(default="http://localhost:3000")

    # ---- Supabase ----
    supabase_url: str = Field(default="")
    supabase_anon_key: str = Field(default="")
    supabase_service_role_key: str = Field(default="")
    supabase_jwt_secret: str = Field(default="")
    database_url: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/postgres"
    )

    # ---- Qdrant ----
    qdrant_url: str = Field(default="http://localhost:6333")
    qdrant_api_key: str = Field(default="")
    qdrant_collection: str = Field(default="vespera_knowledge")

    # ---- Gemini ----
    gemini_api_key: str = Field(default="")
    gemini_model: str = Field(default="gemini-2.0-flash")
    gemini_embed_model: str = Field(default="text-embedding-004")

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]

    @property
    def is_production(self) -> bool:
        return self.api_env.lower() in {"production", "prod"}


@lru_cache
def get_settings() -> Settings:
    return Settings()
