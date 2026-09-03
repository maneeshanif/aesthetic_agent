"""CRM listing/detail/update — pagination, search, tenant isolation, RBAC."""

from __future__ import annotations

import pytest

from app.models.orm import Patient, TriageSession


async def _add_patient(db, spa_id, **kw) -> Patient:
    p = Patient(spa_id=spa_id, **kw)
    db.add(p)
    await db.commit()
    await db.refresh(p)
    return p


@pytest.mark.asyncio
async def test_list_is_scoped_to_the_callers_spa(client, seed, auth_headers, db) -> None:
    a = await seed(slug="alpha")
    b = await seed(slug="bravo")
    await _add_patient(db, a["spa_id"], full_name="A One")
    await _add_patient(db, a["spa_id"], full_name="A Two")
    await _add_patient(db, b["spa_id"], full_name="B One")

    ra = await client.get("/api/v1/patients", headers=auth_headers(a["user_id"], a["spa_id"]))
    rb = await client.get("/api/v1/patients", headers=auth_headers(b["user_id"], b["spa_id"]))

    assert ra.json()["total"] == 2
    assert rb.json()["total"] == 1
    assert {p["full_name"] for p in ra.json()["items"]} == {"A One", "A Two"}


@pytest.mark.asyncio
async def test_search_matches_name_and_treatment(client, seed, auth_headers, db) -> None:
    s = await seed()
    await _add_patient(db, s["spa_id"], full_name="Elena Rostova", requested_treatment="Profhilo")
    await _add_patient(db, s["spa_id"], full_name="Marcus Vance", requested_treatment="Botox")
    h = auth_headers(s["user_id"], s["spa_id"])

    assert (await client.get("/api/v1/patients?q=elena", headers=h)).json()["total"] == 1
    assert (await client.get("/api/v1/patients?q=botox", headers=h)).json()["total"] == 1
    assert (await client.get("/api/v1/patients?q=zzz", headers=h)).json()["total"] == 0


@pytest.mark.asyncio
async def test_status_filter_and_pagination(client, seed, auth_headers, db) -> None:
    s = await seed()
    await _add_patient(db, s["spa_id"], full_name="P1", status="booked")
    await _add_patient(db, s["spa_id"], full_name="P2", status="qualifying")
    await _add_patient(db, s["spa_id"], full_name="P3", status="qualifying")
    h = auth_headers(s["user_id"], s["spa_id"])

    booked = await client.get("/api/v1/patients?status=booked", headers=h)
    assert booked.json()["total"] == 1

    page1 = await client.get("/api/v1/patients?limit=2", headers=h)
    assert len(page1.json()["items"]) == 2
    assert page1.json()["total"] == 3
    page2 = await client.get("/api/v1/patients?limit=2&offset=2", headers=h)
    assert len(page2.json()["items"]) == 1


@pytest.mark.asyncio
async def test_detail_includes_linked_sessions(client, seed, auth_headers, db) -> None:
    s = await seed()
    p = await _add_patient(db, s["spa_id"], full_name="Elena")
    db.add(
        TriageSession(
            spa_id=s["spa_id"], patient_id=p.id, channel="chat_tester", status="completed"
        )
    )
    await db.commit()

    resp = await client.get(
        f"/api/v1/patients/{p.id}", headers=auth_headers(s["user_id"], s["spa_id"])
    )
    assert resp.status_code == 200
    assert len(resp.json()["sessions"]) == 1


@pytest.mark.asyncio
async def test_detail_cross_tenant_is_404(client, seed, auth_headers, db) -> None:
    a = await seed(slug="alpha")
    b = await seed(slug="bravo")
    p = await _add_patient(db, a["spa_id"], full_name="Secret")

    resp = await client.get(
        f"/api/v1/patients/{p.id}", headers=auth_headers(b["user_id"], b["spa_id"])
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_patch_status_as_manager(client, seed, auth_headers, db) -> None:
    s = await seed(role="manager")
    p = await _add_patient(db, s["spa_id"], full_name="Elena", status="qualifying")

    resp = await client.patch(
        f"/api/v1/patients/{p.id}",
        headers=auth_headers(s["user_id"], s["spa_id"], role="manager"),
        json={"status": "booked", "notes": "Confirmed for Tuesday"},
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "booked"
    assert resp.json()["notes"] == "Confirmed for Tuesday"


@pytest.mark.asyncio
async def test_patch_forbidden_for_front_desk(client, seed, auth_headers, db) -> None:
    s = await seed(role="front_desk")
    p = await _add_patient(db, s["spa_id"], full_name="Elena")

    resp = await client.patch(
        f"/api/v1/patients/{p.id}",
        headers=auth_headers(s["user_id"], s["spa_id"], role="front_desk"),
        json={"status": "booked"},
    )
    assert resp.status_code == 403
