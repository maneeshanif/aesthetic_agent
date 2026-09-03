"""Portable column types.

Native `UUID` / `JSONB` on PostgreSQL (production against Supabase); `CHAR(36)` /
`JSON` on SQLite (test suite). Keeps one ORM definition working on both.
"""

from __future__ import annotations

import uuid
from typing import Any

from sqlalchemy import CHAR, JSON, TypeDecorator
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

JSONColumn = JSON().with_variant(JSONB(), "postgresql")


class GUID(TypeDecorator):
    """Platform-independent UUID stored as native uuid on PG, CHAR(36) elsewhere."""

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect: Any):  # noqa: ANN401
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value: Any, dialect: Any):  # noqa: ANN401
        if value is None:
            return None
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(str(value))
        return value if dialect.name == "postgresql" else str(value)

    def process_result_value(self, value: Any, dialect: Any):  # noqa: ANN401
        if value is None:
            return None
        return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
