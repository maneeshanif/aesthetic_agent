"""App boots; probes and the error envelope behave."""

from __future__ import annotations

import httpx
import pytest


@pytest.mark.asyncio
async def test_health_ok(client: httpx.AsyncClient) -> None:
    resp = await client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "vespera-api"
    assert "version" in body


@pytest.mark.asyncio
async def test_versioned_health_ok(client: httpx.AsyncClient) -> None:
    resp = await client.get("/api/v1/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.asyncio
async def test_unknown_route_returns_error_envelope(client: httpx.AsyncClient) -> None:
    resp = await client.get("/does-not-exist")
    assert resp.status_code == 404
    body = resp.json()
    assert set(body["error"].keys()) == {"code", "message"}
    assert body["error"]["code"] == "http_404"


@pytest.mark.asyncio
async def test_openapi_schema_available(client: httpx.AsyncClient) -> None:
    resp = await client.get("/openapi.json")
    assert resp.status_code == 200
    assert resp.json()["info"]["title"] == "Vespera AI API"
