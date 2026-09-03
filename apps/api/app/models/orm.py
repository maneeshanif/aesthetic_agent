"""SQLAlchemy ORM models for Phase 1.

Schema of record is ``migrations/0001_init_phase1.sql``. These mirror it for the
application + test suite. PostgreSQL-only objects (RLS policies, triggers,
``pg_trgm`` GIN index) live only in the SQL migration.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base
from app.models.types import GUID, JSONColumn


def _uuid() -> uuid.UUID:
    return uuid.uuid4()


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )


class Spa(TimestampMixin, Base):
    __tablename__ = "spas"
    __table_args__ = (
        CheckConstraint("length(name) between 1 and 120", name="ck_spas_name_len"),
        CheckConstraint("status in ('active','suspended')", name="ck_spas_status"),
        CheckConstraint("pms_provider in ('internal')", name="ck_spas_pms_provider"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=_uuid)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String(48), nullable=False, unique=True)
    booking_url: Mapped[str | None] = mapped_column(Text)
    timezone: Mapped[str] = mapped_column(Text, nullable=False, default="America/New_York")
    pms_provider: Mapped[str] = mapped_column(Text, nullable=False, default="internal")
    status: Mapped[str] = mapped_column(Text, nullable=False, default="active")

    members: Mapped[list[SpaMember]] = relationship(
        back_populates="spa", cascade="all, delete-orphan"
    )


class SpaMember(TimestampMixin, Base):
    __tablename__ = "spa_members"
    __table_args__ = (
        UniqueConstraint("spa_id", "user_id", name="uq_spa_members_spa_user"),
        CheckConstraint("role in ('owner','manager','front_desk')", name="ck_members_role"),
        CheckConstraint("status in ('active','invited','disabled')", name="ck_members_status"),
        Index("idx_spa_members_user", "user_id"),
        Index("idx_spa_members_spa", "spa_id", "role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=_uuid)
    spa_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("spas.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(GUID(), nullable=False)
    role: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="active")
    invited_email: Mapped[str | None] = mapped_column(Text)
    invited_by: Mapped[uuid.UUID | None] = mapped_column(GUID())

    spa: Mapped[Spa] = relationship(back_populates="members")


class Patient(TimestampMixin, Base):
    __tablename__ = "patients"
    __table_args__ = (
        CheckConstraint(
            "channel in ('chat_tester','instagram','web','voice')", name="ck_patients_channel"
        ),
        CheckConstraint(
            "status in ('new','qualifying','medically_cleared',"
            "'contraindication_flagged','booked','abandoned')",
            name="ck_patients_status",
        ),
        Index("idx_patients_spa_created", "spa_id", "created_at"),
        Index("idx_patients_spa_status", "spa_id", "status"),
        # NULLs are distinct in a unique index on both Postgres and SQLite, so an
        # unfiltered unique index matches the migration's `where phone is not null`.
        Index("uniq_patients_spa_phone", "spa_id", "phone", unique=True),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=_uuid)
    spa_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("spas.id", ondelete="CASCADE"), nullable=False
    )
    full_name: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    email: Mapped[str | None] = mapped_column(Text)
    instagram_handle: Mapped[str | None] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(Text, nullable=False, default="chat_tester")
    requested_treatment: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="new")
    medical_flags: Mapped[list] = mapped_column(JSONColumn, nullable=False, default=list)
    estimated_value: Mapped[float | None] = mapped_column(Numeric(10, 2, asdecimal=False))
    notes: Mapped[str | None] = mapped_column(Text)

    sessions: Mapped[list[TriageSession]] = relationship(back_populates="patient")


class TriageSession(TimestampMixin, Base):
    __tablename__ = "triage_sessions"
    __table_args__ = (
        CheckConstraint(
            "channel in ('chat_tester','instagram','web','voice')", name="ck_sessions_channel"
        ),
        CheckConstraint(
            "status in ('active','qualifying','completed','abandoned','error')",
            name="ck_sessions_status",
        ),
        Index("idx_sessions_spa_created", "spa_id", "created_at"),
        Index("idx_sessions_spa_status", "spa_id", "status"),
        Index("idx_sessions_patient", "patient_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=_uuid)
    spa_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("spas.id", ondelete="CASCADE"), nullable=False
    )
    patient_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("patients.id", ondelete="SET NULL")
    )
    channel: Mapped[str] = mapped_column(Text, nullable=False, default="chat_tester")
    status: Mapped[str] = mapped_column(Text, nullable=False, default="active")
    external_thread_id: Mapped[str | None] = mapped_column(Text)
    messages: Mapped[list] = mapped_column(JSONColumn, nullable=False, default=list)
    ai_transcript: Mapped[list] = mapped_column(JSONColumn, nullable=False, default=list)
    booking_url_issued: Mapped[str | None] = mapped_column(Text)
    last_message_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    patient: Mapped[Patient | None] = relationship(back_populates="sessions")


class KnowledgeDocument(TimestampMixin, Base):
    __tablename__ = "knowledge_documents"
    __table_args__ = (
        CheckConstraint("file_type in ('pdf','markdown')", name="ck_knowledge_file_type"),
        CheckConstraint(
            "status in ('uploaded','chunking','embedded','failed')", name="ck_knowledge_status"
        ),
        CheckConstraint("chunk_count >= 0", name="ck_knowledge_chunk_count"),
        Index("idx_knowledge_spa_created", "spa_id", "created_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=_uuid)
    spa_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("spas.id", ondelete="CASCADE"), nullable=False
    )
    filename: Mapped[str] = mapped_column(Text, nullable=False)
    file_type: Mapped[str] = mapped_column(Text, nullable=False)
    storage_path: Mapped[str | None] = mapped_column(Text)
    byte_size: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(Text, nullable=False, default="uploaded")
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    error_message: Mapped[str | None] = mapped_column(Text)
    uploaded_by: Mapped[uuid.UUID | None] = mapped_column(GUID())
    embedded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
