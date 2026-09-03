"""Spa-context resolution + role guards, exercised through a probe route."""

from __future__ import annotations

import uuid

import httpx
import pytest
from fastapi import Depends, FastAPI

from app.core.dependencies import SpaContext, get_spa_context, require_role
from app.core.errors import register_error_handlers


@pytest.fixture
def probe_client():
    probe = FastAPI()
    register_error_handlers(probe)

    @probe.get("/ctx")
    async def ctx(c: SpaContext = Depends(get_spa_context)):
        return {"spa_id": str(c.spa_id), "role": c.role}

    @probe.get("/owner-only")
    async def owner_only(c: SpaContext = Depends(require_role("owner"))):
        return {"ok": True}

    transport = httpx.ASGITransport(app=probe, raise_app_exceptions=False)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_missing_bearer_is_401(probe_client, auth_headers) -> None:
    async with probe_client as c:
        resp = await c.get("/ctx")
    assert resp.status_code == 401
    assert resp.json()["error"]["code"] == "missing_token"


@pytest.mark.asyncio
async def test_missing_spa_header_is_403(probe_client) -> None:
    from tests.conftest import make_token

    token = make_token(uuid.uuid4())
    async with probe_client as c:
        resp = await c.get("/ctx", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "spa_header_missing"


@pytest.mark.asyncio
async def test_spa_header_not_in_claims_is_403(probe_client) -> None:
    from tests.conftest import make_token

    member_spa = uuid.uuid4()
    other_spa = uuid.uuid4()
    uid = uuid.uuid4()
    token = make_token(uid, spa_ids=[member_spa], memberships={member_spa: "owner"})
    async with probe_client as c:
        resp = await c.get(
            "/ctx",
            headers={"Authorization": f"Bearer {token}", "X-Spa-Id": str(other_spa)},
        )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "spa_forbidden"


@pytest.mark.asyncio
async def test_resolves_role_from_claims(probe_client, auth_headers) -> None:
    uid, spa = uuid.uuid4(), uuid.uuid4()
    async with probe_client as c:
        resp = await c.get("/ctx", headers=auth_headers(uid, spa, role="front_desk"))
    assert resp.status_code == 200
    assert resp.json() == {"spa_id": str(spa), "role": "front_desk"}


@pytest.mark.asyncio
async def test_require_role_allows_and_denies(probe_client, auth_headers) -> None:
    uid, spa = uuid.uuid4(), uuid.uuid4()
    async with probe_client as c:
        ok = await c.get("/owner-only", headers=auth_headers(uid, spa, role="owner"))
        denied = await c.get("/owner-only", headers=auth_headers(uid, spa, role="manager"))
    assert ok.status_code == 200
    assert denied.status_code == 403
    assert denied.json()["error"]["code"] == "insufficient_role"
