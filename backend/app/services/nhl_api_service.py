"""Fetch NHL team data via nhl-api-py.

Teams are loaded with client.teams.teams() and league_standings() for city names.
Used by the seed/sync script. Arena data comes from arenas.json only.
"""

import logging
from typing import Any

logger = logging.getLogger(__name__)


def fetch_teams_from_nhl() -> list[dict[str, Any]]:
    """
    Fetch all NHL teams via nhl-api-py.
    Returns list of dicts with keys: name, abbreviation, city.
    Uses client.teams.teams() and league_standings() for city names.
    """
    try:
        from nhlpy import NHLClient
    except ImportError:
        logger.error("nhl-api-py is not installed. Install with: pip install nhl-api-py")
        raise

    logger.debug("Using nhl-api-py to fetch teams (client.teams.teams() + league_standings())")
    client = NHLClient(timeout=30, follow_redirects=True)
    city_by_abbreviation: dict[str, str] | None = None

    try:
        teams = client.teams.teams()
    except Exception as e:
        logger.exception("nhl-api-py teams() failed: %s", e)
        raise

    if not teams:
        logger.warning("nhl-api-py returned no teams")
        return []

    # Combine team info with city names from standings response
    try:
        standings = client.standings.league_standings()
        city_by_abbreviation = _city_map_from_standings(standings)
        logger.debug("City names linked for %d teams", len(city_by_abbreviation))
    except Exception as e:
        logger.debug("Could not get standings for city names: %s", e)

    team_info = [_team_from_library(t, city_by_abbreviation) for t in teams if isinstance(t, dict)]
    logger.info("Found %d teams and city names from nhl-api-py", len(team_info))
    return team_info


# Helper methods
def _team_from_library(team: dict[str, Any], city_by_abbreviation: dict[str, str] | None) -> dict[str, Any]:
    """Map nhl-api-py team dict to format: name, abbreviation, city.
    Library returns 'abbr' (not 'abbreviation');
    """
    abbreviation = (team.get("abbr") or "").strip().upper()
    name = team.get("name") or abbreviation or "Unknown"
    city = None
    if city_by_abbreviation and abbreviation:
        city = city_by_abbreviation.get(abbreviation)
    return {
        "name": name,
        "abbreviation": abbreviation,
        "city": city,
    }


def _city_map_from_standings(standings: dict[str, Any]) -> dict[str, str]:
    """Link team abbreviations to city names from league_standings() response."""
    city_by_abbreviation: dict[str, str] = {}
    for row in standings.get("standings") or []:
        if not isinstance(row, dict):
            continue
        abbreviation_obj = row.get("teamAbbrev")
        place_obj = row.get("placeName")
        abbreviation = abbreviation_obj.get("default", "") if isinstance(abbreviation_obj, dict) else ""
        city = place_obj.get("default") if isinstance(place_obj, dict) else None
        if abbreviation and city:
            city_by_abbreviation[abbreviation] = city
    return city_by_abbreviation
