"""Tenant settings + team management, including RBAC and last-owner protection."""

from __future__ import annotations

import uuid

import pytest


@pytest.mark.asyncio
async def test_create_tenant_makes_caller_owner(client, fake_auth_admin, db) -> None:
    uid = uuid.uuid4()
    from tests.conftest import make_token

    token = make_token(uid)
    resp = await client.post(
        "/api/v1/tenant",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Sterling Aesthetics", "slug": "sterling", "timezone": "America/Chicago"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["slug"] == "sterling"
    assert body["pms_provider"] == "internal"

    # claims were pushed to Supabase with an owner membership
    meta = fake_auth_admin.metadata[uid]
    assert meta["memberships"] == {body["id"]: "owner"}
    assert meta["spa_ids"] == [body["id"]]


@pytest.mark.asyncio
async def test_create_tenant_rejects_duplicate_slug(client, seed) -> None:
    await seed(slug="sterling")
    from tests.conftest import make_token

    token = make_token(uuid.uuid4())
    resp = await client.post(
        "/api/v1/tenant",
        headers={"Authorization": f"Bearer {token}"},
        json={"name": "Another", "slug": "sterling"},
    )
    assert resp.status_code == 409
    assert resp.json()["error"]["code"] == "slug_taken"


@pytest.mark.asyncio
async def test_get_and_patch_tenant_settings(client, seed, auth_headers) -> None:
    s = await seed(slug="glow", role="owner")
    h = auth_headers(s["user_id"], s["spa_id"], role="owner")

    got = await client.get("/api/v1/tenant", headers=h)
    assert got.status_code == 200
    assert got.json()["slug"] == "glow"

    patched = await client.patch(
        "/api/v1/tenant", headers=h, json={"booking_url": "https://book.example.com/glow"}
    )
    assert patched.status_code == 200
    assert patched.json()["booking_url"] == "https://book.example.com/glow"


@pytest.mark.asyncio
async def test_patch_tenant_rejects_non_http_url(client, seed, auth_headers) -> None:
    s = await seed(role="owner")
    resp = await client.patch(
        "/api/v1/tenant",
        headers=auth_headers(s["user_id"], s["spa_id"], role="owner"),
        json={"booking_url": "ftp://nope"},
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_patch_tenant_forbidden_for_front_desk(client, seed, auth_headers) -> None:
    s = await seed(role="front_desk")
    resp = await client.patch(
        "/api/v1/tenant",
        headers=auth_headers(s["user_id"], s["spa_id"], role="front_desk"),
        json={"name": "Hacked"},
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "insufficient_role"


@pytest.mark.asyncio
async def test_invite_member_creates_invited_row(
    client, seed, auth_headers, fake_auth_admin, db
) -> None:
    from sqlalchemy import select

    from app.models.orm import SpaMember

    s = await seed(role="owner")
    invitee = uuid.uuid4()
    fake_auth_admin.next_user_id = invitee

    resp = await client.post(
        "/api/v1/tenant/members",
        headers=auth_headers(s["user_id"], s["spa_id"], role="owner"),
        json={"email": "desk@clinic.com", "role": "front_desk"},
    )
    assert resp.status_code == 201, resp.text
    body = resp.json()
    assert body["status"] == "invited"
    assert body["role"] == "front_desk"
    assert "desk@clinic.com" in fake_auth_admin.invited

    row = await db.scalar(
        select(SpaMember).where(
            SpaMember.spa_id == s["spa_id"], SpaMember.user_id == invitee
        )
    )
    assert row is not None
    assert row.status == "invited"
    assert row.invited_email == "desk@clinic.com"
    assert row.invited_by == s["user_id"]


@pytest.mark.asyncio
async def test_duplicate_invite_conflicts(client, seed, auth_headers, fake_auth_admin) -> None:
    s = await seed(role="owner")
    h = auth_headers(s["user_id"], s["spa_id"], role="owner")
    invitee = uuid.uuid4()
    fake_auth_admin.next_user_id = invitee
    await client.post(
        "/api/v1/tenant/members", headers=h, json={"email": "d@c.com", "role": "manager"}
    )
    fake_auth_admin.next_user_id = invitee
    again = await client.post(
        "/api/v1/tenant/members", headers=h, json={"email": "d@c.com", "role": "manager"}
    )
    assert again.status_code == 409
    assert again.json()["error"]["code"] == "already_member"


@pytest.mark.asyncio
async def test_invite_requires_owner(client, seed, auth_headers) -> None:
    s = await seed(role="manager")
    resp = await client.post(
        "/api/v1/tenant/members",
        headers=auth_headers(s["user_id"], s["spa_id"], role="manager"),
        json={"email": "x@y.com", "role": "front_desk"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_cannot_remove_last_owner(client, seed, auth_headers) -> None:
    s = await seed(role="owner")
    h = auth_headers(s["user_id"], s["spa_id"], role="owner")
    members = (await client.get("/api/v1/tenant/members", headers=h)).json()
    owner_member_id = members[0]["id"]

    resp = await client.delete(f"/api/v1/tenant/members/{owner_member_id}", headers=h)
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "last_owner"


@pytest.mark.asyncio
async def test_cannot_demote_last_owner(client, seed, auth_headers) -> None:
    s = await seed(role="owner")
    h = auth_headers(s["user_id"], s["spa_id"], role="owner")
    members = (await client.get("/api/v1/tenant/members", headers=h)).json()
    owner_member_id = members[0]["id"]

    resp = await client.patch(
        f"/api/v1/tenant/members/{owner_member_id}", headers=h, json={"role": "manager"}
    )
    assert resp.status_code == 403
    assert resp.json()["error"]["code"] == "last_owner"


@pytest.mark.asyncio
async def test_update_member_role_succeeds_with_second_owner(
    client, seed, auth_headers, fake_auth_admin, db
) -> None:
    s = await seed(role="owner")
    h = auth_headers(s["user_id"], s["spa_id"], role="owner")

    # add a second member to demote
    fake_auth_admin.next_user_id = uuid.uuid4()
    invited = (
        await client.post(
            "/api/v1/tenant/members",
            headers=h,
            json={"email": "m@clinic.com", "role": "manager"},
        )
    ).json()

    resp = await client.patch(
        f"/api/v1/tenant/members/{invited['id']}", headers=h, json={"role": "front_desk"}
    )
    assert resp.status_code == 200
    assert resp.json()["role"] == "front_desk"
