"""Visits Services to GET/CREATE/UPDATE/DELETE visits."""

import uuid

from app.db.session import delete, save
from app.exceptions import VisitNotFoundError
from app.models import Arena, Team, User, Visit
from app.schemas import ArenaResponse, TeamResponse, VisitCreate, VisitResponse
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload


async def get_users_visits(
    user: User, db: AsyncSession, skip: int, limit: int
) -> tuple[list[VisitResponse], int]:
    """List paginated visits for a user, newest visit_date first, with total count."""

    total = await _count_visits_for_user(user, db)

    visits_stmt = (
        select(Visit)
        .where(Visit.user_id == user.id)
        .options(
            selectinload(Visit.home_team),
            selectinload(Visit.away_team),
            selectinload(Visit.arena),
        )
        .order_by(Visit.visit_date.desc())
        .offset(skip)
        .limit(limit)
    )
    visits_result = await db.execute(visits_stmt)
    visits = visits_result.scalars().all()

    return [VisitResponse.model_validate(v) for v in visits], total


async def get_visit_by_id_for_user(
    visit_id: uuid.UUID, user: User, db: AsyncSession
) -> VisitResponse:
    """Return one visit if it exists and belongs to the user."""

    visit_stmt = (
        select(Visit)
        .where(Visit.id == visit_id, Visit.user_id == user.id)
        .options(
            selectinload(Visit.home_team),
            selectinload(Visit.away_team),
            selectinload(Visit.arena),
        )
    )
    visit_result = await db.execute(visit_stmt)
    visit = visit_result.scalar_one_or_none()
    if visit is None:
        raise VisitNotFoundError()

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

async def delete_visit_by_id(visit_id: uuid.UUID, user: User, db: AsyncSession) -> None:
    """Delete a given visit if it belongs to the current user."""

    visit = await db.get(Visit, visit_id)
    if visit is None or visit.user_id != user.id:
        raise VisitNotFoundError()

    await delete(visit, db)

# Helper functions
async def _count_visits_for_user(user: User, db: AsyncSession) -> int:
    count_stmt = (
        select(func.count())
        .select_from(Visit)
        .where(Visit.user_id == user.id)
    )
    count_result = await db.execute(count_stmt)
    return count_result.scalar_one()


def _validate_teams_and_arena(
    home_team: Team | None,
    away_team: Team | None,
    arena: Arena | None,
) -> None:
    if home_team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Home team not found")
    if away_team is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Away team not found")
    if arena is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Arena not found")