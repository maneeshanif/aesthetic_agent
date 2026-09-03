"""Test harness.

Runs the FastAPI app against an in-memory SQLite database (schema from the ORM
metadata) with a real Supabase-style JWT signed by a test secret, so the auth +
authorization layers are exercised for real. Tenant isolation is asserted at the
query layer (RLS itself is Postgres-only and covered by the SQL migration).
"""

from __future__ import annotations

import os
import uuid
from datetime import UTC, datetime, timedelta

os.environ.setdefault("SUPABASE_JWT_SECRET", "test-secret")
os.environ.setdefault("API_ENV", "test")
os.environ.setdefault("GEMINI_API_KEY", "test")
os.environ.setdefault("DATABASE_URL", "sqlite+aiosqlite://")

import httpx  # noqa: E402
import jwt  # noqa: E402
import pytest  # noqa: E402
import pytest_asyncio  # noqa: E402
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

import app.models.orm  # noqa: E402,F401  (populate metadata)
from app.api.providers import (  # noqa: E402
    get_auth_admin,
    get_storage,
    get_triage_agent,
    get_vector_service,
)
from app.core.dependencies import get_db, get_raw_session  # noqa: E402
from app.core.settings import get_settings  # noqa: E402
from app.db.database import Base  # noqa: E402
from app.main import app  # noqa: E402

get_settings.cache_clear()

JWT_SECRET = "test-secret"


# ─────────────── infrastructure fixtures ───────────────
@pytest_asyncio.fixture
async def engine():
    eng = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
def session_factory(engine):
    return async_sessionmaker(engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def db(session_factory):
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(session_factory, fake_auth_admin, fake_storage, fake_vector_service, fake_agent):
    async def _session_dep():
        async with session_factory() as session:
            yield session

    app.dependency_overrides[get_raw_session] = _session_dep
    app.dependency_overrides[get_db] = _session_dep
    app.dependency_overrides[get_auth_admin] = lambda: fake_auth_admin
    app.dependency_overrides[get_storage] = lambda: fake_storage
    app.dependency_overrides[get_vector_service] = lambda: fake_vector_service
    app.dependency_overrides[get_triage_agent] = lambda: fake_agent

    transport = httpx.ASGITransport(app=app, raise_app_exceptions=False)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ─────────────── auth helpers ───────────────
def make_token(
    user_id: uuid.UUID,
    *,
    spa_ids: list[uuid.UUID] | None = None,
    memberships: dict[uuid.UUID, str] | None = None,
    email: str = "user@example.com",
    expired: bool = False,
    secret: str = JWT_SECRET,
) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "aud": "authenticated",
        "email": email,
        "iat": int(now.timestamp()),
        "exp": int((now - timedelta(hours=1) if expired else now + timedelta(hours=1)).timestamp()),
        "app_metadata": {
            "spa_ids": [str(s) for s in (spa_ids or [])],
            "memberships": {str(k): v for k, v in (memberships or {}).items()},
        },
    }
    return jwt.encode(payload, secret, algorithm="HS256")


@pytest.fixture
def auth_headers():
    def _headers(
        user_id: uuid.UUID,
        spa_id: uuid.UUID | None = None,
        role: str = "owner",
        **kw,
    ) -> dict[str, str]:
        spa_ids = [spa_id] if spa_id else []
        memberships = {spa_id: role} if spa_id else {}
        token = make_token(user_id, spa_ids=spa_ids, memberships=memberships, **kw)
        h = {"Authorization": f"Bearer {token}"}
        if spa_id:
            h["X-Spa-Id"] = str(spa_id)
        return h

    return _headers


# ─────────────── seed helpers ───────────────
@pytest_asyncio.fixture
async def seed(db):
    """Insert a spa + owner membership; return their ids."""
    from app.models.orm import Spa, SpaMember

    async def _seed(
        *, slug: str = "sterling", role: str = "owner", booking_url: str | None = None
    ):
        spa = Spa(name=f"Spa {slug}", slug=slug, timezone="America/New_York", booking_url=booking_url)
        db.add(spa)
        await db.flush()
        user_id = uuid.uuid4()
        db.add(SpaMember(spa_id=spa.id, user_id=user_id, role=role, status="active"))
        await db.commit()
        return {"spa_id": spa.id, "user_id": user_id, "role": role}

    return _seed


# ─────────────── fakes for external services ───────────────
class FakeAuthAdmin:
    def __init__(self):
        self.metadata: dict[uuid.UUID, dict] = {}
        self.invited: list[str] = []
        self.next_user_id: uuid.UUID | None = None

    async def invite_user(self, email: str) -> uuid.UUID:
        self.invited.append(email)
        uid = self.next_user_id or uuid.uuid4()
        self.next_user_id = None
        return uid

    async def update_app_metadata(self, user_id, spa_ids, memberships) -> None:
        self.metadata[user_id] = {"spa_ids": spa_ids, "memberships": memberships}


class FakeStorage:
    def __init__(self):
        self.objects: dict[str, bytes] = {}

    async def upload(self, path: str, data: bytes, content_type: str) -> str:
        self.objects[path] = data
        return path

    async def delete(self, path: str) -> None:
        self.objects.pop(path, None)


class FakeVectorService:
    def __init__(self):
        self.points: list[dict] = []
        self.search_results: list[dict] = []
        self.deleted: list[tuple] = []

    async def ensure_collection(self) -> None:  # pragma: no cover - trivial
        pass

    async def upsert_chunks(self, spa_id, document_id, chunks, source_filename) -> int:
        for i, c in enumerate(chunks):
            self.points.append(
                {
                    "spa_id": str(spa_id),
                    "document_id": str(document_id),
                    "chunk_index": i,
                    "text": c,
                    "source_filename": source_filename,
                }
            )
        return len(chunks)

    async def search(self, spa_id, query, limit: int = 5) -> list[dict]:
        return list(self.search_results)[:limit]

    async def delete_document(self, spa_id, document_id) -> None:
        self.deleted.append((str(spa_id), str(document_id)))


class FakeAgent:
    def __init__(self):
        from app.services.ai_service import TriageDecision

        self.decision = TriageDecision(reply="How can I help?", decision="collect_info")
        self.calls: list = []

    async def run(self, inp):
        self.calls.append(inp)
        return self.decision


@pytest.fixture
def fake_auth_admin():
    return FakeAuthAdmin()


@pytest.fixture
def fake_storage():
    return FakeStorage()


@pytest.fixture
def fake_vector_service():
    return FakeVectorService()


@pytest.fixture
def fake_agent():
    return FakeAgent()
