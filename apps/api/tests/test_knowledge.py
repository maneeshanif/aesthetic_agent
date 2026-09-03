"""Knowledge base upload / list / delete — ingestion status, RBAC, isolation."""

from __future__ import annotations

import pytest

MD = ("# Clinic Rules\n\n" + "Botox is $12 per unit. Do not treat if pregnant. " * 40).encode()


@pytest.mark.asyncio
async def test_upload_markdown_runs_ingestion(client, seed, auth_headers, fake_storage) -> None:
    s = await seed(role="owner")
    resp = await client.post(
        "/api/v1/knowledge/documents",
        headers=auth_headers(s["user_id"], s["spa_id"], role="owner"),
        files={"file": ("rules.md", MD, "text/markdown")},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "embedded"
    assert body["chunk_count"] >= 1
    assert body["file_type"] == "markdown"
    assert len(fake_storage.objects) == 1

    listing = await client.get(
        "/api/v1/knowledge/documents", headers=auth_headers(s["user_id"], s["spa_id"])
    )
    assert len(listing.json()) == 1


@pytest.mark.asyncio
async def test_upload_rejects_unsupported_type(client, seed, auth_headers) -> None:
    s = await seed(role="owner")
    resp = await client.post(
        "/api/v1/knowledge/documents",
        headers=auth_headers(s["user_id"], s["spa_id"], role="owner"),
        files={"file": ("logo.png", b"\x89PNG\r\n", "image/png")},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "unsupported_file_type"


@pytest.mark.asyncio
async def test_upload_rejects_empty_file(client, seed, auth_headers) -> None:
    s = await seed(role="owner")
    resp = await client.post(
        "/api/v1/knowledge/documents",
        headers=auth_headers(s["user_id"], s["spa_id"], role="owner"),
        files={"file": ("rules.md", b"", "text/markdown")},
    )
    assert resp.status_code == 422
    assert resp.json()["error"]["code"] == "empty_file"


@pytest.mark.asyncio
async def test_upload_forbidden_for_front_desk(client, seed, auth_headers) -> None:
    s = await seed(role="front_desk")
    resp = await client.post(
        "/api/v1/knowledge/documents",
        headers=auth_headers(s["user_id"], s["spa_id"], role="front_desk"),
        files={"file": ("rules.md", MD, "text/markdown")},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_delete_removes_row_and_vectors(
    client, seed, auth_headers, fake_vector_service
) -> None:
    s = await seed(role="owner")
    h = auth_headers(s["user_id"], s["spa_id"], role="owner")
    created = (
        await client.post(
            "/api/v1/knowledge/documents",
            headers=h,
            files={"file": ("rules.md", MD, "text/markdown")},
        )
    ).json()

    resp = await client.delete(f"/api/v1/knowledge/documents/{created['id']}", headers=h)
    assert resp.status_code == 204
    assert (str(s["spa_id"]), created["id"]) in fake_vector_service.deleted
    assert (await client.get("/api/v1/knowledge/documents", headers=h)).json() == []


@pytest.mark.asyncio
async def test_delete_cross_tenant_is_404(client, seed, auth_headers) -> None:
    a = await seed(slug="alpha", role="owner")
    b = await seed(slug="bravo", role="owner")
    created = (
        await client.post(
            "/api/v1/knowledge/documents",
            headers=auth_headers(a["user_id"], a["spa_id"], role="owner"),
            files={"file": ("rules.md", MD, "text/markdown")},
        )
    ).json()

    resp = await client.delete(
        f"/api/v1/knowledge/documents/{created['id']}",
        headers=auth_headers(b["user_id"], b["spa_id"], role="owner"),
    )
    assert resp.status_code == 404
