"""Visits Services to GET/CREATE/UPDATE/DELETE visits."""

import uuid

from app.core.exceptions import ResourceNotFoundError, VisitNotFoundError
from app.db.session import delete, save
from app.models import Arena, Team, User, Visit
from app.schemas import (ArenaResponse, TeamResponse, VisitCreate,
                         VisitResponse, VisitUpdate)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

# Eager loads for VisitResponse (home/away teams + arena); keep list and single GET in sync.
_VISIT_RELATION_LOADS = (
    selectinload(Visit.home_team),
    selectinload(Visit.away_team),
    selectinload(Visit.arena),
)


async def get_users_visits(
    user: User, db: AsyncSession, skip: int, limit: int
) -> tuple[list[VisitResponse], int]:
    """List paginated visits for a user, newest visit_date first, with total count."""

    total = await _count_visits_for_user(user, db)
    visits = await _list_visits_for_user(user, db, skip, limit)

    return [VisitResponse.model_validate(v) for v in visits], total


async def get_visit_by_id_for_user(
    visit_id: uuid.UUID, user: User, db: AsyncSession
) -> VisitResponse:
    """Return one visit if it exists and belongs to the user."""

    visit = await _get_visit_for_user(visit_id, user, db)
    return VisitResponse.model_validate(visit)


async def create_new_visit(visit: VisitCreate, user: User, db: AsyncSession) -> VisitResponse:
    """Create a new visit for the current user."""

    home_team = await db.get(Team, visit.home_team_id)
    away_team = await db.get(Team, visit.away_team_id)
    arena = await db.get(Arena, visit.arena_id)

    _validate_teams_and_arena(home_team, away_team, arena)

    new_visit = Visit(
        user_id=user.id,
        arena_id=arena.id,
        home_team_id=home_team.id,
        away_team_id=away_team.id,
        visit_date=visit.visit_date,
        seating_location=visit.seating_location,
    )
    saved_visit = await save(new_visit, db)

    return VisitResponse(
        id=saved_visit.id,
        home_team=TeamResponse.model_validate(home_team),
        away_team=TeamResponse.model_validate(away_team),
        arena=ArenaResponse.model_validate(arena),
        visit_date=saved_visit.visit_date,
        seating_location=saved_visit.seating_location,
        created_at=saved_visit.created_at,
        updated_at=saved_visit.updated_at
    )

async def update_visit_for_user(
    visit_id: uuid.UUID,
    payload: VisitUpdate,
    user: User,
    db: AsyncSession,
) -> VisitResponse:
    """Apply a partial update to a visit owned by the user."""

    visit = await _get_visit_for_user(visit_id, user, db)

    data = payload.model_dump(exclude_unset=True)
    if not data:
        return VisitResponse.model_validate(visit)

    await _validate_patch_foreign_keys(db, data)

    for key, value in data.items():
        setattr(visit, key, value)

    await db.commit()

    return await get_visit_by_id_for_user(visit_id, user, db)


async def delete_visit_by_id(visit_id: uuid.UUID, user: User, db: AsyncSession) -> None:
    """Delete a given visit if it belongs to the current user."""

    visit = await db.get(Visit, visit_id)
    if visit is None or visit.user_id != user.id:
        raise VisitNotFoundError()

    await delete(visit, db)

# Helper functions
async def _list_visits_for_user(
    user: User, db: AsyncSession, skip: int, limit: int
) -> list[Visit]:
    """Paginated visits for a user, newest first, with the same relations as GET-by-id."""

    stmt = (
        select(Visit)
        .where(Visit.user_id == user.id)
        .options(*_VISIT_RELATION_LOADS)
        .order_by(Visit.visit_date.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


async def _get_visit_for_user(
    visit_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> Visit:
    """Load one visit by id for this user with arena and teams (same graph as GET)."""

    stmt = (
        select(Visit)
        .where(Visit.id == visit_id, Visit.user_id == user.id)
        .options(*_VISIT_RELATION_LOADS)
    )
    result = await db.execute(stmt)
    visit = result.scalar_one_or_none()
    if visit is None:
        raise VisitNotFoundError()
    return visit


async def _count_visits_for_user(user: User, db: AsyncSession) -> int:
    count_stmt = (
        select(func.count())
        .select_from(Visit)
        .where(Visit.user_id == user.id)
    )
    count_result = await db.execute(count_stmt)
    return count_result.scalar_one()


async def _validate_patch_foreign_keys(db: AsyncSession, data: dict) -> None:
    """Ensure any ID fields in a PATCH body reference existing rows."""

    if "home_team_id" in data:
        if await db.get(Team, data["home_team_id"]) is None:
            raise ResourceNotFoundError("Home team not found")
    if "away_team_id" in data:
        if await db.get(Team, data["away_team_id"]) is None:
            raise ResourceNotFoundError("Away team not found")
    if "arena_id" in data:
        if await db.get(Arena, data["arena_id"]) is None:
            raise ResourceNotFoundError("Arena not found")


def _validate_teams_and_arena(
    home_team: Team | None,
    away_team: Team | None,
    arena: Arena | None,
) -> None:
    if home_team is None:
        raise ResourceNotFoundError("Home team not found")
    if away_team is None:
        raise ResourceNotFoundError("Away team not found")
    if arena is None:
        raise ResourceNotFoundError("Arena not found")