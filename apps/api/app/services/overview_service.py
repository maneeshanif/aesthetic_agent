"""Dashboard overview metrics."""

from __future__ import annotations

import uuid
from datetime import UTC, datetime
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.orm import Patient, TriageSession
from app.models.schemas import OverviewOut

_AFTER_HOURS_START = 18  # 6pm
_AFTER_HOURS_END = 9  # 9am


def _is_after_hours(dt: datetime, tz_name: str) -> bool:
    try:
        tz = ZoneInfo(tz_name)
    except (ZoneInfoNotFoundError, ValueError):
        tz = ZoneInfo("America/New_York")
    # Timestamps are stored in UTC; SQLite hands them back naive.
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=UTC)
    local_hour = dt.astimezone(tz).hour
    return local_hour >= _AFTER_HOURS_START or local_hour < _AFTER_HOURS_END


async def compute_overview(
    session: AsyncSession, spa_id: uuid.UUID, timezone_name: str
) -> OverviewOut:
    leads_captured = await session.scalar(
        select(func.count()).select_from(Patient).where(Patient.spa_id == spa_id)
    )
    ai_conversations = await session.scalar(
        select(func.count()).select_from(TriageSession).where(TriageSession.spa_id == spa_id)
    )
    flagged = await session.scalar(
        select(func.count())
        .select_from(Patient)
        .where(Patient.spa_id == spa_id, Patient.status == "contraindication_flagged")
    )
    booked = await session.scalar(
        select(func.count())
        .select_from(Patient)
        .where(Patient.spa_id == spa_id, Patient.status.in_(["medically_cleared", "booked"]))
    )

    issued_rows = (
        await session.scalars(
            select(TriageSession.created_at).where(
                TriageSession.spa_id == spa_id,
                TriageSession.booking_url_issued.is_not(None),
            )
        )
    ).all()
    bookings_with_link = len(issued_rows)
    after_hours = sum(1 for dt in issued_rows if dt and _is_after_hours(dt, timezone_name))

    leads_captured = leads_captured or 0
    ai_conversations = ai_conversations or 0

    return OverviewOut(
        leads_captured=leads_captured,
        ai_conversations=ai_conversations,
        booking_click_through_rate=(
            round(bookings_with_link / ai_conversations, 4) if ai_conversations else 0.0
        ),
        after_hours_bookings=after_hours,
        contraindication_flag_rate=(
            round((flagged or 0) / leads_captured, 4) if leads_captured else 0.0
        ),
        bookings=booked or 0,
    )
