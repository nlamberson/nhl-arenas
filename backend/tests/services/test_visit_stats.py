"""Unit tests for visit stats aggregation."""

import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock

import pytest
from app.models.user import User
from app.schemas.stats import VisitStatsResponse
from app.services.visits import get_user_visit_stats


@pytest.mark.asyncio
async def test_get_user_visit_stats_queries_counts() -> None:
    user = User(
        id=uuid.uuid4(),
        firebase_uid="uid",
        email="a@b.com",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db = AsyncMock()

    total_result = MagicMock()
    total_result.scalar_one.return_value = 31
    teams_result = MagicMock()
    teams_result.scalar_one.return_value = 12
    arenas_result = MagicMock()
    arenas_result.scalar_one.return_value = 8

    db.execute = AsyncMock(side_effect=[total_result, teams_result, arenas_result])

    stats = await get_user_visit_stats(user, db)

    assert stats == VisitStatsResponse(
        total_visits=31,
        teams_seen=12,
        arenas_visited=8,
    )
    assert db.execute.await_count == 3
