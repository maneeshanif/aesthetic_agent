"""Dashboard overview metric computation."""

from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.models.orm import Patient, TriageSession
from app.services.overview_service import compute_overview


@pytest.mark.asyncio
async def test_metrics_match_seeded_data(db, seed) -> None:
    s = await seed()
    spa_id = s["spa_id"]

    db.add_all(
        [
            Patient(spa_id=spa_id, full_name="A", status="qualifying"),
            Patient(spa_id=spa_id, full_name="B", status="medically_cleared"),
            Patient(spa_id=spa_id, full_name="C", status="contraindication_flagged"),
        ]
    )
    # two conversations; one handed out a booking link, after-hours (23:00 UTC → evening ET)
    db.add_all(
        [
            TriageSession(
                spa_id=spa_id,
                status="completed",
                booking_url_issued="https://book.example.com",
                created_at=datetime(2026, 3, 2, 23, 0, tzinfo=UTC),
            ),
            TriageSession(spa_id=spa_id, status="qualifying"),
        ]
    )
    await db.commit()

    out = await compute_overview(db, spa_id, "America/New_York")

    assert out.leads_captured == 3
    assert out.ai_conversations == 2
    assert out.bookings == 1
    assert out.booking_click_through_rate == 0.5
    assert out.contraindication_flag_rate == round(1 / 3, 4)
    assert out.after_hours_bookings == 1


@pytest.mark.asyncio
async def test_overview_endpoint_is_tenant_scoped(client, seed, auth_headers, db) -> None:
    a = await seed(slug="alpha")
    b = await seed(slug="bravo")
    db.add_all(
        [
            Patient(spa_id=a["spa_id"], full_name="A1", status="new"),
            Patient(spa_id=a["spa_id"], full_name="A2", status="new"),
            Patient(spa_id=b["spa_id"], full_name="B1", status="new"),
        ]
    )
    await db.commit()

    ra = await client.get("/api/v1/overview", headers=auth_headers(a["user_id"], a["spa_id"]))
    rb = await client.get("/api/v1/overview", headers=auth_headers(b["user_id"], b["spa_id"]))
    assert ra.json()["leads_captured"] == 2
    assert rb.json()["leads_captured"] == 1


@pytest.mark.asyncio
async def test_overview_zero_state(client, seed, auth_headers) -> None:
    s = await seed()
    resp = await client.get("/api/v1/overview", headers=auth_headers(s["user_id"], s["spa_id"]))
    body = resp.json()
    assert body["leads_captured"] == 0
    assert body["booking_click_through_rate"] == 0.0
    assert body["contraindication_flag_rate"] == 0.0
