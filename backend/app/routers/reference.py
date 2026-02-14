"""Read-only reference data endpoints: teams and arenas."""

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.arena import Arena
from app.models.team import Team
from app.schemas import ArenaResponse, TeamResponse

router = APIRouter(prefix="/api/v1/reference", tags=["reference"])


@router.get(
    "/teams",
    response_model=list[TeamResponse],
    summary="List all NHL teams",
    description="Returns all teams from the database, ordered by name.",
)
async def list_teams(db: AsyncSession = Depends(get_db)) -> list[TeamResponse]:
    """List all NHL teams."""
    result = await db.execute(select(Team).order_by(Team.name))
    teams = result.scalars().all()
    return [TeamResponse.model_validate(t) for t in teams]


@router.get(
    "/arenas",
    response_model=list[ArenaResponse],
    summary="List all NHL arenas",
    description="Returns all arenas from the database, ordered by name.",
)
async def list_arenas(db: AsyncSession = Depends(get_db)) -> list[ArenaResponse]:
    """List all NHL arenas."""
    result = await db.execute(select(Arena).order_by(Arena.name))
    arenas = result.scalars().all()
    return [ArenaResponse.model_validate(a) for a in arenas]
