"""Sync NHL teams (from nhl-api-py) and arenas (from arenas.json) into the database.

Run from the backend directory with the virtual environment activated:
  cd backend
  source .venv/bin/activate   # or: .venv\\Scripts\\activate on Windows
  python -m app.scripts.seed_reference_data
"""

import asyncio
import json
import logging
import sys
from pathlib import Path

# Ensure app is importable when run as __main__
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

try:
    from sqlalchemy import select
    from sqlalchemy.ext.asyncio import AsyncSession
except ModuleNotFoundError:
    print(
        "Missing dependency. Run from the backend directory with the venv activated:\n"
        "  cd backend\n"
        "  source .venv/bin/activate\n"
        "  pip install -r requirements.txt\n"
        "  python -m app.scripts.seed_reference_data",
        file=sys.stderr,
    )
    sys.exit(1)

from app.db.session import AsyncSessionLocal
from app.models.arena import Arena
from app.models.team import Team
from app.services.nhl_api_service import fetch_teams_from_nhl

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Path to arenas JSON (keyed by team abbreviation)
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
ARENAS_JSON_PATH = DATA_DIR / "arenas.json"


async def seed_nhl_data() -> None:
    """Sync teams from nhl-api-py and arenas from arenas.json."""
    async with AsyncSessionLocal() as session:
        try:
            logger.info("Fetching teams from nhl-api-py...")
            teams_data = fetch_teams_from_nhl()
            if not teams_data:
                logger.warning("No teams returned from NHL API")
                return

            created, updated = await _upsert_teams(session, teams_data)
            await session.commit()
            logger.info("Teams: %d created, %d updated", created, updated)

            teams_by_abbreviation = await _get_teams_by_abbreviation(session)
            arenas = _load_arenas()
            if not arenas:
                logger.info("Skipping arena sync (no arenas file or invalid)")
                return

            await _sync_arenas(session, arenas, teams_by_abbreviation)
            await session.commit()
            logger.info("Arenas: synced from arenas.json (%d entries)", len(arenas))
            logger.info("Seed/sync completed successfully.")
        except Exception as e:
            logger.exception("Seed failed: %s", e)
            await session.rollback()
            raise
        finally:
            await session.close()


# Helper functions
async def _upsert_teams(session: AsyncSession, teams_data: list[dict]) -> tuple[int, int]:
    """Upsert teams by abbreviation. Caller must commit. Returns (created, updated)."""
    result = await session.execute(select(Team))
    existing_teams = {team.abbreviation: team for team in result.scalars().all()}
    created = 0
    updated = 0
    for team_data in teams_data:
        abbreviation = (team_data.get("abbreviation") or "").strip().upper()
        if not abbreviation:
            continue
        if abbreviation in existing_teams:
            team = existing_teams[abbreviation]
            team.name = team_data.get("name") or team.name
            team.city = team_data.get("city")
            updated += 1
        else:
            team = Team(
                name=team_data.get("name") or "",
                abbreviation=abbreviation,
                city=team_data.get("city"),
            )
            session.add(team)
            existing_teams[abbreviation] = team
            created += 1
    await session.flush()
    return created, updated


async def _get_teams_by_abbreviation(session: AsyncSession) -> dict[str, Team]:
    """Reload teams from DB and return mapping abbreviation -> Team (with persisted ids)."""
    result = await session.execute(select(Team))
    return {team.abbreviation: team for team in result.scalars().all()}


async def _sync_arenas(
    session: AsyncSession,
    arenas: dict[str, dict],
    teams_by_abbreviation: dict[str, Team],
) -> None:
    """Create or update arenas from arenas dict and link to teams. Caller must commit."""
    for abbreviation_key, arena_info in arenas.items():
        abbreviation = (abbreviation_key or "").strip().upper()
        if not abbreviation or abbreviation not in teams_by_abbreviation:
            continue
        team = teams_by_abbreviation[abbreviation]
        name = arena_info.get("name")
        if not name:
            continue
        city = arena_info.get("city")
        capacity = arena_info.get("capacity")

        if team.arena_id:
            arena = await session.get(Arena, team.arena_id)
            if arena:
                arena.name = name
                arena.city = city
                arena.capacity = capacity
                continue

        # Create new arena and link to team
        arena = Arena(
            name=name,
            city=city,
            capacity=capacity,
        )
        session.add(arena)
        await session.flush()
        team.arena_id = arena.id


def _load_arenas() -> dict[str, dict] | None:
    """Load arenas.json. Returns None if file missing or invalid."""
    if not ARENAS_JSON_PATH.exists():
        logger.warning("Arenas file not found: %s", ARENAS_JSON_PATH)
        return None
    try:
        with open(ARENAS_JSON_PATH, encoding="utf-8") as f:
            data = json.load(f)
        if not isinstance(data, dict):
            logger.warning("arenas.json must be a JSON object keyed by team abbreviation")
            return None
        return data
    except json.JSONDecodeError as e:
        logger.warning("Invalid JSON in arenas.json: %s", e)
        return None


def main() -> None:
    """Entrypoint for python -m app.scripts.seed_reference_data."""
    asyncio.run(seed_nhl_data())


if __name__ == "__main__":
    main()
