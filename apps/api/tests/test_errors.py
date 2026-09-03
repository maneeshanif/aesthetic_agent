"""The uniform error envelope for every failure mode."""

from __future__ import annotations

import httpx
import pytest
from fastapi import FastAPI

from app.core.errors import (
    AppError,
    ConflictError,
    NotFoundError,
    register_error_handlers,
)


@pytest.fixture
def err_client():
    a = FastAPI()
    register_error_handlers(a)

    @a.get("/not-found")
    async def _nf():
        raise NotFoundError("nope")

    @a.get("/conflict")
    async def _c():
        raise ConflictError("dup", code="dup")

    @a.get("/custom")
    async def _cu():
        raise AppError("teapot", code="teapot", status_code=418)

    @a.get("/boom")
    async def _b():
        raise RuntimeError("unexpected")

    @a.get("/validated")
    async def _v(n: int):
        return {"n": n}

    transport = httpx.ASGITransport(app=a, raise_app_exceptions=False)
    return httpx.AsyncClient(transport=transport, base_url="http://test")


@pytest.mark.asyncio
async def test_app_errors_map_to_envelope(err_client) -> None:
    async with err_client as c:
        nf = await c.get("/not-found")
        conflict = await c.get("/conflict")
        custom = await c.get("/custom")

    assert nf.status_code == 404
    assert nf.json() == {"error": {"code": "not_found", "message": "nope"}}
    assert conflict.status_code == 409
    assert conflict.json()["error"]["code"] == "dup"
    assert custom.status_code == 418
    assert custom.json()["error"]["code"] == "teapot"


@pytest.mark.asyncio
async def test_unhandled_exception_is_generic_500(err_client) -> None:
    async with err_client as c:
        resp = await c.get("/boom")
    assert resp.status_code == 500
    assert resp.json() == {
        "error": {"code": "internal_error", "message": "An unexpected error occurred."}
    }


@pytest.mark.asyncio
async def test_request_validation_uses_envelope(err_client) -> None:
    async with err_client as c:
        resp = await c.get("/validated", params={"n": "not-an-int"})
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "validation_error"
