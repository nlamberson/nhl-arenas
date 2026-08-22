"""Visits Services to GET/CREATE/UPDATE/DELETE visits."""

import uuid

from app.core.exceptions import ResourceNotFoundError, VisitNotFoundError
from app.db.session import delete, save
from app.models import Arena, Team, User, Visit
from app.schemas import (ArenaResponse, TeamResponse, VisitCreate,
                         VisitResponse, VisitUpdate)
from app.schemas.stats import VisitStatsResponse
from app.services.images import delete_storage_objects_for_visit
from sqlalchemy import func, select, union_all
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import noload, selectinload

# Eager loads for list/latest (no images — keep payloads lean).
_VISIT_LIST_LOADS = (
    selectinload(Visit.home_team),
    selectinload(Visit.away_team),
    selectinload(Visit.arena),
    noload(Visit.images),
)

# Detail GET includes image metadata (max 5 rows; no Firebase).
_VISIT_DETAIL_LOADS = (
    selectinload(Visit.home_team),
    selectinload(Visit.away_team),
    selectinload(Visit.arena),
    selectinload(Visit.images),
)

# Visit delete needs images for Storage cleanup before DB cascade.
_VISIT_DELETE_LOADS = (selectinload(Visit.images),)


async def get_user_visit_stats(user: User, db: AsyncSession) -> VisitStatsResponse:
    """
    Get counts for a users visits, teams seen, and arenas seen, without loading \
    full visit data.
    """

    total = await _count_visits_for_user(user, db)

    team_ids = union_all(
        select(Visit.home_team_id.label("team_id")).where(Visit.user_id == user.id),
        select(Visit.away_team_id.label("team_id")).where(Visit.user_id == user.id),
    ).subquery()

    teams_stmt = select(func.count(func.distinct(team_ids.c.team_id)))
    teams_result = await db.execute(teams_stmt)
    teams_seen = teams_result.scalar_one() or 0

    arenas_stmt = select(func.count(func.distinct(Visit.arena_id))).where(
        Visit.user_id == user.id
    )
    arenas_result = await db.execute(arenas_stmt)
    arenas_visited = arenas_result.scalar_one() or 0

    return VisitStatsResponse(
        total_visits=total,
        teams_seen=teams_seen,
        arenas_visited=arenas_visited,
    )


async def get_latest_visit_for_user(
    user: User, db: AsyncSession
) -> VisitResponse | None:
    """Most recent visit by visit_date. Returns None if the user has no visits."""

    visits = await _list_visits_for_user(user, db, skip=0, limit=1)
    if not visits:
        return None
    return VisitResponse.model_validate(visits[0])


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
    """Return one visit if it exists and belongs to the user (includes images)."""

    visit = await _get_visit_for_user(visit_id, user, db, include_images=True)
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
        images=[],
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

    visit = await _get_visit_for_user(visit_id, user, db, include_images=True)

    data = payload.model_dump(exclude_unset=True)
    if not data:
        return VisitResponse.model_validate(visit)

    await _validate_patch_foreign_keys(db, data)

    for key, value in data.items():
        setattr(visit, key, value)

    await db.commit()

    return await get_visit_by_id_for_user(visit_id, user, db)


async def delete_visit_by_id(visit_id: uuid.UUID, user: User, db: AsyncSession) -> None:
    """Delete Storage objects first, then the visit (DB cascades image rows)."""

    stmt = (
        select(Visit)
        .where(Visit.id == visit_id, Visit.user_id == user.id)
        .options(*_VISIT_DELETE_LOADS)
    )
    result = await db.execute(stmt)
    visit = result.scalar_one_or_none()
    if visit is None:
        raise VisitNotFoundError()

    await delete_storage_objects_for_visit(visit)
    await delete(visit, db)

# Helper functions
async def _list_visits_for_user(
    user: User, db: AsyncSession, skip: int, limit: int
) -> list[Visit]:
    """Paginated visits for a user, newest first, without image metadata."""

    stmt = (
        select(Visit)
        .where(Visit.user_id == user.id)
        .options(*_VISIT_LIST_LOADS)
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
    *,
    include_images: bool = False,
) -> Visit:
    """Load one visit by id for this user with arena and teams."""

    loads = _VISIT_DETAIL_LOADS if include_images else _VISIT_LIST_LOADS
    stmt = (
        select(Visit)
        .where(Visit.id == visit_id, Visit.user_id == user.id)
        .options(*loads)
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
