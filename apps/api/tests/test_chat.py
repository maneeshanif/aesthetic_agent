"""Single-worker triage endpoint: persistence, booking hand-off, red flags, upsert."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import func, select

from app.models.orm import Patient, TriageSession
from app.services.ai_service import TriageDecision


@pytest.mark.asyncio
async def test_creates_session_and_persists_transcript(
    client, seed, auth_headers, fake_agent, fake_vector_service
) -> None:
    s = await seed(booking_url="https://book.example.com")
    fake_vector_service.search_results = [
        {"chunk_id": "c1", "score": 0.9, "source": "menu.pdf", "text": "Botox $12/unit"}
    ]
    fake_agent.decision = TriageDecision(reply="Tell me more!", decision="collect_info")
    h = auth_headers(s["user_id"], s["spa_id"])

    resp = await client.post("/api/v1/chat", headers=h, json={"message": "Hi, Botox pricing?"})
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["status"] == "qualifying"
    assert body["patient_status"] == "qualifying"
    assert body["reply"] == "Tell me more!"

    got = await client.get(f"/api/v1/sessions/{body['session_id']}", headers=h)
    sess = got.json()
    assert [m["role"] for m in sess["messages"]] == ["user", "assistant"]
    assert len(sess["ai_transcript"]) == 1
    assert sess["ai_transcript"][0]["retrieved"][0]["chunk_id"] == "c1"


@pytest.mark.asyncio
async def test_hands_out_booking_url_when_cleared(
    client, seed, auth_headers, fake_agent, db
) -> None:
    s = await seed(booking_url="https://book.example.com/x")
    fake_agent.decision = TriageDecision(
        reply="You're all set!", decision="book", requested_treatment="Botox", estimated_value=480
    )
    h = auth_headers(s["user_id"], s["spa_id"])

    body = (
        await client.post("/api/v1/chat", headers=h, json={"message": "Book me for Botox"})
    ).json()

    assert body["booking_url"] == "https://book.example.com/x"
    assert body["patient_status"] == "medically_cleared"
    assert body["status"] == "completed"

    sess = await db.get(TriageSession, uuid.UUID(body["session_id"]))
    assert sess.booking_url_issued == "https://book.example.com/x"


@pytest.mark.asyncio
async def test_no_booking_url_configured_falls_back_to_qualifying(
    client, seed, auth_headers, fake_agent
) -> None:
    s = await seed(booking_url=None)
    fake_agent.decision = TriageDecision(reply="ok", decision="book")
    h = auth_headers(s["user_id"], s["spa_id"])

    body = (await client.post("/api/v1/chat", headers=h, json={"message": "book"})).json()
    assert body["booking_url"] is None
    assert body["status"] == "qualifying"


@pytest.mark.asyncio
async def test_contraindication_flags_and_creates_patient(
    client, seed, auth_headers, fake_agent, db
) -> None:
    s = await seed(booking_url="https://book.example.com")
    fake_agent.decision = TriageDecision(
        reply="Let's check with the clinic first.",
        decision="contraindicated",
        medical_flags=[{"rule": "Accutane", "detail": "Patient on isotretinoin"}],
        requested_treatment="Chemical Peel",
    )
    h = auth_headers(s["user_id"], s["spa_id"])

    body = (
        await client.post(
            "/api/v1/chat",
            headers=h,
            json={
                "message": "Can I get a peel? I'm on Accutane",
                "contact": {"full_name": "Sarah T", "phone": "5559998888"},
            },
        )
    ).json()

    assert body["booking_url"] is None
    assert body["patient_status"] == "contraindication_flagged"
    assert body["medical_flags"][0]["rule"] == "Accutane"
    assert body["patient_id"] is not None

    patient = await db.get(Patient, uuid.UUID(body["patient_id"]))
    assert patient.status == "contraindication_flagged"
    assert patient.medical_flags[0]["rule"] == "Accutane"
    assert patient.full_name == "Sarah T"


@pytest.mark.asyncio
async def test_repeated_turns_upsert_same_patient(
    client, seed, auth_headers, fake_agent, db
) -> None:
    s = await seed(booking_url="https://book.example.com")
    fake_agent.decision = TriageDecision(
        reply="ok", decision="collect_info", requested_treatment="Botox"
    )
    h = auth_headers(s["user_id"], s["spa_id"])

    first = (
        await client.post(
            "/api/v1/chat",
            headers=h,
            json={"message": "hi", "contact": {"phone": "5551110000", "full_name": "Elena"}},
        )
    ).json()
    second = (
        await client.post(
            "/api/v1/chat",
            headers=h,
            json={
                "message": "still me",
                "session_id": first["session_id"],
                "contact": {"phone": "5551110000"},
            },
        )
    ).json()

    assert first["patient_id"] == second["patient_id"]
    assert first["session_id"] == second["session_id"]
    assert await db.scalar(select(func.count()).select_from(Patient)) == 1


@pytest.mark.asyncio
async def test_agent_receives_tenant_retrieval_and_context(
    client, seed, auth_headers, fake_agent, fake_vector_service
) -> None:
    s = await seed(slug="sterling", booking_url="https://book.example.com")
    fake_vector_service.search_results = [
        {"chunk_id": "c9", "score": 0.8, "source": "rules.md", "text": "No lasers on active tan"}
    ]
    h = auth_headers(s["user_id"], s["spa_id"])

    await client.post("/api/v1/chat", headers=h, json={"message": "laser?"})

    call = fake_agent.calls[0]
    assert call.retrieved == fake_vector_service.search_results
    assert call.booking_url == "https://book.example.com"
    assert call.spa_name == "Spa sterling"


@pytest.mark.asyncio
async def test_session_from_another_tenant_is_404(client, seed, auth_headers, fake_agent) -> None:
    a = await seed(slug="alpha")
    b = await seed(slug="bravo")
    fake_agent.decision = TriageDecision(reply="ok", decision="collect_info")

    made = (
        await client.post(
            "/api/v1/chat",
            headers=auth_headers(a["user_id"], a["spa_id"]),
            json={"message": "hi"},
        )
    ).json()

    resp = await client.post(
        "/api/v1/chat",
        headers=auth_headers(b["user_id"], b["spa_id"]),
        json={"message": "hijack", "session_id": made["session_id"]},
    )
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "session_not_found"

    get_resp = await client.get(
        f"/api/v1/sessions/{made['session_id']}",
        headers=auth_headers(b["user_id"], b["spa_id"]),
    )
    assert get_resp.status_code == 404
