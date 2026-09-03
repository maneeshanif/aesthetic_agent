"""POST /api/v1/auth/sync — activate invited memberships and refresh claims."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import select

from app.models.orm import SpaMember


@pytest.mark.asyncio
async def test_sync_activates_invited_membership_and_pushes_claims(
    client, seed, auth_headers, fake_auth_admin, db
) -> None:
    owner = await seed(role="owner")
    invitee = uuid.uuid4()
    fake_auth_admin.next_user_id = invitee
    await client.post(
        "/api/v1/tenant/members",
        headers=auth_headers(owner["user_id"], owner["spa_id"], role="owner"),
        json={"email": "new@clinic.com", "role": "manager"},
    )

    # invitee logs in (token has no spa claims yet) and calls sync
    from tests.conftest import make_token

    token = make_token(invitee)
    resp = await client.post(
        "/api/v1/auth/sync", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["activated"] == 1
    assert body["memberships"] == {str(owner["spa_id"]): "manager"}

    row = await db.scalar(
        select(SpaMember).where(SpaMember.user_id == invitee)
    )
    assert row.status == "active"
    assert fake_auth_admin.metadata[invitee]["spa_ids"] == [str(owner["spa_id"])]


@pytest.mark.asyncio
async def test_sync_is_idempotent(client, seed, auth_headers, fake_auth_admin) -> None:
    s = await seed(role="owner")
    from tests.conftest import make_token

    token = make_token(s["user_id"])
    first = await client.post("/api/v1/auth/sync", headers={"Authorization": f"Bearer {token}"})
    second = await client.post("/api/v1/auth/sync", headers={"Authorization": f"Bearer {token}"})
    assert first.json()["activated"] == 0  # already active from seed
    assert second.status_code == 200
    assert second.json()["memberships"] == {str(s["spa_id"]): "owner"}
