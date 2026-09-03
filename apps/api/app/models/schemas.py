"""Pydantic v2 request/response schemas for the Phase 1 API."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Generic, Literal, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator

T = TypeVar("T")

Role = Literal["owner", "manager", "front_desk"]
Channel = Literal["chat_tester", "instagram", "web", "voice"]
PatientStatus = Literal[
    "new", "qualifying", "medically_cleared", "contraindication_flagged", "booked", "abandoned"
]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ─────────────── tenant ───────────────
class TenantCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    slug: str = Field(pattern=r"^[a-z0-9-]{2,48}$")
    timezone: str = Field(default="America/New_York", max_length=64)


class TenantUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    timezone: str | None = Field(default=None, max_length=64)
    booking_url: str | None = Field(default=None, max_length=2048)

    @field_validator("booking_url")
    @classmethod
    def _validate_url(cls, v: str | None) -> str | None:
        if v is None or v == "":
            return None
        if not (v.startswith("http://") or v.startswith("https://")):
            raise ValueError("booking_url must start with http:// or https://")
        return v


class TenantOut(ORMModel):
    id: uuid.UUID
    name: str
    slug: str
    booking_url: str | None
    timezone: str
    pms_provider: str
    status: str
    created_at: datetime
    updated_at: datetime


# ─────────────── members ───────────────
class MemberInvite(BaseModel):
    email: str = Field(pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    role: Role


class MemberUpdate(BaseModel):
    role: Role | None = None
    status: Literal["active", "disabled"] | None = None


class MemberOut(ORMModel):
    id: uuid.UUID
    spa_id: uuid.UUID
    user_id: uuid.UUID
    role: Role
    status: str
    invited_email: str | None
    created_at: datetime


class AuthSyncOut(BaseModel):
    user_id: uuid.UUID
    spa_ids: list[uuid.UUID]
    memberships: dict[str, Role]
    activated: int = Field(description="number of 'invited' memberships flipped to 'active'")


# ─────────────── patients ───────────────
class PatientUpdate(BaseModel):
    status: PatientStatus | None = None
    notes: str | None = Field(default=None, max_length=5000)
    estimated_value: float | None = Field(default=None, ge=0)
    full_name: str | None = Field(default=None, max_length=200)
    requested_treatment: str | None = Field(default=None, max_length=200)


class PatientOut(ORMModel):
    id: uuid.UUID
    spa_id: uuid.UUID
    full_name: str | None
    phone: str | None
    email: str | None
    instagram_handle: str | None
    channel: Channel
    requested_treatment: str | None
    status: PatientStatus
    medical_flags: list[dict[str, Any]]
    estimated_value: float | None
    notes: str | None
    created_at: datetime
    updated_at: datetime


class SessionSummary(ORMModel):
    id: uuid.UUID
    status: str
    channel: Channel
    booking_url_issued: str | None
    last_message_at: datetime | None
    created_at: datetime


class PatientDetailOut(PatientOut):
    sessions: list[SessionSummary] = []


class Page(BaseModel, Generic[T]):
    items: list[T]
    total: int
    limit: int
    offset: int


# ─────────────── knowledge ───────────────
class KnowledgeDocOut(ORMModel):
    id: uuid.UUID
    spa_id: uuid.UUID
    filename: str
    file_type: Literal["pdf", "markdown"]
    byte_size: int | None
    status: Literal["uploaded", "chunking", "embedded", "failed"]
    chunk_count: int
    error_message: str | None
    created_at: datetime
    embedded_at: datetime | None


# ─────────────── chat ───────────────
class ChatContact(BaseModel):
    full_name: str | None = Field(default=None, max_length=200)
    phone: str | None = Field(default=None, max_length=20)
    email: str | None = Field(default=None, max_length=200)
    instagram_handle: str | None = Field(default=None, max_length=100)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    session_id: uuid.UUID | None = None
    channel: Channel = "chat_tester"
    external_thread_id: str | None = Field(default=None, max_length=200)
    contact: ChatContact | None = None


class RetrievedChunk(BaseModel):
    chunk_id: str
    score: float
    source: str
    text: str


class ReasoningStep(BaseModel):
    step: int
    agent: str
    action: str
    retrieved: list[RetrievedChunk] = []
    rules_enforced: list[str] = []
    ts: str


class MedicalFlag(BaseModel):
    rule: str
    detail: str
    source_chunk_id: str | None = None


class ChatResponse(BaseModel):
    session_id: uuid.UUID
    reply: str
    status: Literal[
        "active", "qualifying", "completed", "abandoned", "error"
    ]
    patient_status: PatientStatus
    booking_url: str | None = None
    medical_flags: list[MedicalFlag] = []
    reasoning: list[ReasoningStep] = []
    patient_id: uuid.UUID | None = None


class SessionOut(ORMModel):
    id: uuid.UUID
    spa_id: uuid.UUID
    patient_id: uuid.UUID | None
    channel: Channel
    status: str
    messages: list[dict[str, Any]]
    ai_transcript: list[dict[str, Any]]
    booking_url_issued: str | None
    last_message_at: datetime | None
    created_at: datetime


# ─────────────── overview ───────────────
class OverviewOut(BaseModel):
    leads_captured: int
    ai_conversations: int
    booking_click_through_rate: float
    after_hours_bookings: int
    contraindication_flag_rate: float
    bookings: int
