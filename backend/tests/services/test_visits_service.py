"""Unit tests for visits service layer (mocked AsyncSession)."""

import uuid
from datetime import date, datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from app.core.exceptions import ResourceNotFoundError, VisitNotFoundError
from app.models import Arena, Team, User, Visit
from app.schemas.visit import VisitCreate, VisitUpdate
from app.services import visits as visits_service
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import build_arena, build_team, build_visit_with_relations


@pytest.fixture
def user(test_user_id: uuid.UUID) -> User:
    now = datetime.now(timezone.utc)
    return User(
        id=test_user_id,
        firebase_uid="svc-test-uid",
        email="svc@example.com",
        display_name=None,
        photo_url=None,
        created_at=now,
        updated_at=now,
    )


@pytest.mark.asyncio
async def test_get_users_visits_returns_responses_and_total(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    home = build_team(uuid.uuid4(), "H", "H01")
    away = build_team(uuid.uuid4(), "A", "A01")
    arena = build_arena(uuid.uuid4())
    visit = build_visit_with_relations(
        visit_id=uuid.uuid4(),
        user_id=user.id,
        home_team=home,
        away_team=away,
        arena=arena,
    )

    count_result = MagicMock()
    count_result.scalar_one.return_value = 7
    list_result = MagicMock()
    list_result.scalars.return_value.all.return_value = [visit]
    db.execute = AsyncMock(side_effect=[count_result, list_result])

    responses, total = await visits_service.get_users_visits(user, db, skip=0, limit=20)

    assert total == 7
    assert len(responses) == 1
    assert responses[0].id == visit.id
    assert responses[0].home_team.name == "H"


@pytest.mark.asyncio
async def test_get_visit_by_id_for_user_returns_response(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    home = build_team(uuid.uuid4())
    away = build_team(uuid.uuid4())
    arena = build_arena(uuid.uuid4())
    vid = uuid.uuid4()
    visit = build_visit_with_relations(
        visit_id=vid,
        user_id=user.id,
        home_team=home,
        away_team=away,
        arena=arena,
    )
    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = visit
    db.execute = AsyncMock(return_value=exec_result)

    out = await visits_service.get_visit_by_id_for_user(vid, user, db)

    assert out.id == vid
    assert out.arena.name == arena.name


@pytest.mark.asyncio
async def test_get_visit_by_id_for_user_raises_when_missing(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=exec_result)

    with pytest.raises(VisitNotFoundError):
        await visits_service.get_visit_by_id_for_user(uuid.uuid4(), user, db)


@pytest.mark.asyncio
@patch("app.services.visits.save", new_callable=AsyncMock)
async def test_create_new_visit_success(mock_save: AsyncMock, user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    home_id = uuid.uuid4()
    away_id = uuid.uuid4()
    arena_id = uuid.uuid4()
    home = build_team(home_id, "Home", "HOM")
    away = build_team(away_id, "Away", "AWY")
    arena = build_arena(arena_id, "The Barn")

    async def save_impl(entity: Visit, session: AsyncSession) -> Visit:
        entity.id = uuid.uuid4()
        entity.created_at = datetime.now(timezone.utc)
        entity.updated_at = entity.created_at
        return entity

    mock_save.side_effect = save_impl

    db.get = AsyncMock(side_effect=[home, away, arena])

    payload = VisitCreate(
        home_team_id=home_id,
        away_team_id=away_id,
        arena_id=arena_id,
        visit_date=date(2024, 2, 1),
        seating_location="302",
    )

    result = await visits_service.create_new_visit(payload, user, db)

    assert result.home_team.id == home_id
    assert result.away_team.id == away_id
    assert result.arena.id == arena_id
    assert result.visit_date == date(2024, 2, 1)
    assert result.seating_location == "302"
    mock_save.assert_awaited_once()


@pytest.mark.asyncio
async def test_create_new_visit_raises_when_home_team_missing(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    away = build_team(uuid.uuid4())
    arena = build_arena(uuid.uuid4())
    db.get = AsyncMock(side_effect=[None, away, arena])

    payload = VisitCreate(
        home_team_id=uuid.uuid4(),
        away_team_id=uuid.uuid4(),
        arena_id=uuid.uuid4(),
        visit_date=date(2024, 2, 1),
    )

    with pytest.raises(ResourceNotFoundError, match="Home team"):
        await visits_service.create_new_visit(payload, user, db)


@pytest.mark.asyncio
async def test_create_new_visit_raises_when_away_team_missing(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    home = build_team(uuid.uuid4())
    arena = build_arena(uuid.uuid4())
    db.get = AsyncMock(side_effect=[home, None, arena])

    payload = VisitCreate(
        home_team_id=home.id,
        away_team_id=uuid.uuid4(),
        arena_id=uuid.uuid4(),
        visit_date=date(2024, 2, 1),
    )

    with pytest.raises(ResourceNotFoundError, match="Away team"):
        await visits_service.create_new_visit(payload, user, db)


@pytest.mark.asyncio
async def test_create_new_visit_raises_when_arena_missing(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    home = build_team(uuid.uuid4())
    away = build_team(uuid.uuid4())
    db.get = AsyncMock(side_effect=[home, away, None])

    payload = VisitCreate(
        home_team_id=home.id,
        away_team_id=away.id,
        arena_id=uuid.uuid4(),
        visit_date=date(2024, 2, 1),
    )

    with pytest.raises(ResourceNotFoundError, match="Arena"):
        await visits_service.create_new_visit(payload, user, db)


@pytest.mark.asyncio
async def test_update_visit_for_user_empty_patch_returns_without_commit(
    user: User,
) -> None:
    db = AsyncMock(spec=AsyncSession)
    home = build_team(uuid.uuid4())
    away = build_team(uuid.uuid4())
    arena = build_arena(uuid.uuid4())
    vid = uuid.uuid4()
    visit = build_visit_with_relations(
        visit_id=vid,
        user_id=user.id,
        home_team=home,
        away_team=away,
        arena=arena,
    )
    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = visit
    db.execute = AsyncMock(return_value=exec_result)

    out = await visits_service.update_visit_for_user(vid, VisitUpdate(), user, db)

    assert out.seating_location == visit.seating_location
    db.commit.assert_not_awaited()


@pytest.mark.asyncio
async def test_update_visit_for_user_applies_patch_and_commits(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    home = build_team(uuid.uuid4())
    away = build_team(uuid.uuid4())
    arena = build_arena(uuid.uuid4())
    vid = uuid.uuid4()
    visit = build_visit_with_relations(
        visit_id=vid,
        user_id=user.id,
        home_team=home,
        away_team=away,
        arena=arena,
        seating_location="100",
    )
    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = visit
    db.execute = AsyncMock(return_value=exec_result)

    payload = VisitUpdate(seating_location="Club")

    out = await visits_service.update_visit_for_user(vid, payload, user, db)

    db.commit.assert_awaited_once()
    assert visit.seating_location == "Club"
    assert out.seating_location == "Club"


@pytest.mark.asyncio
async def test_update_visit_for_user_raises_visit_not_found(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = None
    db.execute = AsyncMock(return_value=exec_result)

    with pytest.raises(VisitNotFoundError):
        await visits_service.update_visit_for_user(
            uuid.uuid4(),
            VisitUpdate(seating_location="x"),
            user,
            db,
        )


@pytest.mark.asyncio
async def test_update_visit_for_user_raises_when_patch_home_team_missing(
    user: User,
) -> None:
    db = AsyncMock(spec=AsyncSession)
    home = build_team(uuid.uuid4())
    away = build_team(uuid.uuid4())
    arena = build_arena(uuid.uuid4())
    vid = uuid.uuid4()
    visit = build_visit_with_relations(
        visit_id=vid,
        user_id=user.id,
        home_team=home,
        away_team=away,
        arena=arena,
    )
    exec_result = MagicMock()
    exec_result.scalar_one_or_none.return_value = visit
    db.execute = AsyncMock(return_value=exec_result)
    new_team_id = uuid.uuid4()
    db.get = AsyncMock(return_value=None)

    payload = VisitUpdate(home_team_id=new_team_id)

    with pytest.raises(ResourceNotFoundError, match="Home team"):
        await visits_service.update_visit_for_user(vid, payload, user, db)


@pytest.mark.asyncio
@patch("app.services.visits.delete", new_callable=AsyncMock)
async def test_delete_visit_by_id_calls_delete(
    mock_delete: AsyncMock, user: User
) -> None:
    db = AsyncMock(spec=AsyncSession)
    vid = uuid.uuid4()
    visit = Visit(
        id=vid,
        user_id=user.id,
        arena_id=uuid.uuid4(),
        home_team_id=uuid.uuid4(),
        away_team_id=uuid.uuid4(),
        visit_date=date(2024, 1, 1),
        seating_location=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.get = AsyncMock(return_value=visit)

    await visits_service.delete_visit_by_id(vid, user, db)

    mock_delete.assert_awaited_once_with(visit, db)


@pytest.mark.asyncio
async def test_delete_visit_by_id_raises_when_visit_missing(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    db.get = AsyncMock(return_value=None)

    with pytest.raises(VisitNotFoundError):
        await visits_service.delete_visit_by_id(uuid.uuid4(), user, db)


@pytest.mark.asyncio
async def test_delete_visit_by_id_raises_when_wrong_user(user: User) -> None:
    db = AsyncMock(spec=AsyncSession)
    other_user_id = uuid.uuid4()
    vid = uuid.uuid4()
    visit = Visit(
        id=vid,
        user_id=other_user_id,
        arena_id=uuid.uuid4(),
        home_team_id=uuid.uuid4(),
        away_team_id=uuid.uuid4(),
        visit_date=date(2024, 1, 1),
        seating_location=None,
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc),
    )
    db.get = AsyncMock(return_value=visit)

    with pytest.raises(VisitNotFoundError):
        await visits_service.delete_visit_by_id(vid, user, db)
