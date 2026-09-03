"""InternalSupabaseAdapter upsert semantics + tenant scoping."""

from __future__ import annotations

import uuid

import pytest
from sqlalchemy import func, select

from app.models.orm import Patient, Spa
from app.services.pms.supabase_adapter import InternalSupabaseAdapter


async def _spa(db, slug: str) -> uuid.UUID:
    s = Spa(name=slug, slug=slug)
    db.add(s)
    await db.flush()
    return s.id


@pytest.mark.asyncio
async def test_inserts_new_lead(db) -> None:
    spa_id = await _spa(db, "a")
    adapter = InternalSupabaseAdapter(db)

    p = await adapter.upsert_patient(
        spa_id, {"full_name": "Elena", "phone": "+1 555 111 2222", "requested_treatment": "Botox"}
    )
    await db.commit()

    assert p.id is not None
    assert p.spa_id == spa_id
    total = await db.scalar(select(func.count()).select_from(Patient))
    assert total == 1


@pytest.mark.asyncio
async def test_matches_existing_by_phone(db) -> None:
    spa_id = await _spa(db, "a")
    adapter = InternalSupabaseAdapter(db)

    first = await adapter.upsert_patient(spa_id, {"full_name": "Elena", "phone": "5551112222"})
    second = await adapter.upsert_patient(
        spa_id, {"phone": "5551112222", "requested_treatment": "Filler", "status": "qualifying"}
    )
    await db.commit()

    assert first.id == second.id
    assert second.requested_treatment == "Filler"
    assert await db.scalar(select(func.count()).select_from(Patient)) == 1


@pytest.mark.asyncio
async def test_matches_existing_by_email_case_insensitive(db) -> None:
    spa_id = await _spa(db, "a")
    adapter = InternalSupabaseAdapter(db)

    a = await adapter.upsert_patient(spa_id, {"email": "Elena@Clinic.com"})
    b = await adapter.upsert_patient(spa_id, {"email": "elena@clinic.com", "full_name": "Elena R"})
    await db.commit()

    assert a.id == b.id
    assert b.full_name == "Elena R"


@pytest.mark.asyncio
async def test_upsert_never_crosses_tenants(db) -> None:
    spa_a = await _spa(db, "a")
    spa_b = await _spa(db, "b")
    adapter = InternalSupabaseAdapter(db)

    pa = await adapter.upsert_patient(spa_a, {"phone": "5551112222", "full_name": "A Elena"})
    pb = await adapter.upsert_patient(spa_b, {"phone": "5551112222", "full_name": "B Elena"})
    await db.commit()

    assert pa.id != pb.id
    assert await db.scalar(select(func.count()).select_from(Patient)) == 2

    updated = await adapter.upsert_patient(spa_a, {"phone": "5551112222", "status": "booked"})
    await db.commit()
    assert updated.id == pa.id
    assert pb.status == "new"


@pytest.mark.asyncio
async def test_get_patient_is_tenant_scoped(db) -> None:
    spa_a = await _spa(db, "a")
    spa_b = await _spa(db, "b")
    adapter = InternalSupabaseAdapter(db)
    p = await adapter.upsert_patient(spa_a, {"full_name": "Elena"})
    await db.commit()

    assert await adapter.get_patient(spa_a, p.id) is not None
    assert await adapter.get_patient(spa_b, p.id) is None
