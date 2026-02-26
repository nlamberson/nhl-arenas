"""Visits Services to GET/CREATE/UPDATE/DELETE visits."""

import uuid

from app.db.session import delete, save
from app.models import Arena, Team, User, Visit
from app.schemas import ArenaResponse, TeamResponse, VisitCreate, VisitResponse
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession


async def get_users_visits(db: AsyncSession) -> list[VisitResponse]:
    """Get all visits for the current user."""

    # TODO: Implement

    return []

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
    if visit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Visit not found")

    if visit.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized to delete this visit")

    await delete(visit, db)

# Helper functions
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