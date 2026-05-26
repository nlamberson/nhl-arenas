"""Look up NHL game scores from api-web.nhle.com by date and team abbreviations."""

from __future__ import annotations

import asyncio
import logging
from datetime import date
from typing import Any

import httpx

from app.schemas.game import VisitGameResponse
from app.schemas.visit import VisitResponse

logger = logging.getLogger(__name__)

NHL_WEB_API_BASE = "https://api-web.nhle.com/v1"
_SCHEDULE_TIMEOUT = httpx.Timeout(10.0)

# TODO: Save game metadata to DB once discovered to avoid repeat NHLE calls for visits we got info for already.

def _parse_schedule_games(payload: dict[str, Any]) -> list[dict[str, Any]]:
    games: list[dict[str, Any]] = []
    for week in payload.get("gameWeek") or []:
        if not isinstance(week, dict):
            continue
        for game in week.get("games") or []:
            if isinstance(game, dict):
                games.append(game)
    return games


async def _load_schedule_into_cache(
    visit_date: date,
    cache: dict[str, list[dict[str, Any]]],
    client: httpx.AsyncClient,
) -> None:
    """Fetch one date's schedule into cache (no-op if already cached)."""
    key = visit_date.isoformat()
    if key in cache:
        return

    url = f"{NHL_WEB_API_BASE}/schedule/{key}"
    try:
        response = await client.get(url)
        response.raise_for_status()
        cache[key] = _parse_schedule_games(response.json())
    except httpx.HTTPError as exc:
        logger.warning("NHL schedule fetch failed for %s: %s", key, exc)
        cache[key] = []


async def prefetch_schedules_for_dates(
    dates: set[date],
    cache: dict[str, list[dict[str, Any]]],
) -> None:
    """Fetch all unique dates in parallel (one HTTP round-trip batch)."""
    missing = [d for d in dates if d.isoformat() not in cache]
    if not missing:
        return

    async with httpx.AsyncClient(timeout=_SCHEDULE_TIMEOUT) as client:
        results = await asyncio.gather(
            *(_load_schedule_into_cache(d, cache, client) for d in missing),
            return_exceptions=True,
        )

    for visit_date, result in zip(missing, results, strict=True):
        if isinstance(result, Exception):
            key = visit_date.isoformat()
            logger.warning("NHL schedule fetch error for %s: %s", key, result)
            cache.setdefault(key, [])


async def fetch_schedule_for_date(
    visit_date: date,
    cache: dict[str, list[dict[str, Any]]],
) -> list[dict[str, Any]]:
    """Return all games on a date; uses per-request cache keyed by ISO date."""
    key = visit_date.isoformat()
    if key not in cache:
        await prefetch_schedules_for_dates({visit_date}, cache)
    return cache.get(key, [])


def _normalize_abbrev(value: str | None) -> str:
    return (value or "").strip().upper()


def _team_abbrev(team: dict[str, Any] | None) -> str:
    if not isinstance(team, dict):
        return ""
    return _normalize_abbrev(team.get("abbrev"))


def find_game_for_matchup(
    games: list[dict[str, Any]],
    home_abbrev: str,
    away_abbrev: str,
) -> dict[str, Any] | None:
    """Find a game matching home/away abbreviations (also tries swapped)."""
    home = _normalize_abbrev(home_abbrev)
    away = _normalize_abbrev(away_abbrev)
    if not home or not away:
        return None

    for game in games:
        if _team_abbrev(game.get("homeTeam")) == home and _team_abbrev(
            game.get("awayTeam")
        ) == away:
            return game

    for game in games:
        if _team_abbrev(game.get("homeTeam")) == away and _team_abbrev(
            game.get("awayTeam")
        ) == home:
            return game

    return None


def _score_from_team(team: dict[str, Any] | None) -> int | None:
    if not isinstance(team, dict):
        return None
    score = team.get("score")
    return score if isinstance(score, int) else None


def game_to_visit_score(
    game: dict[str, Any] | None,
    *,
    home_abbrev: str,
    away_abbrev: str,
) -> VisitGameResponse:
    """Build VisitGameResponse; maps NHL away/home to visit away/home even if swapped."""
    if not game:
        return VisitGameResponse(matched=False)

    nhl_home = _team_abbrev(game.get("homeTeam"))
    nhl_away = _team_abbrev(game.get("awayTeam"))
    visit_home = _normalize_abbrev(home_abbrev)
    visit_away = _normalize_abbrev(away_abbrev)

    home_team = game.get("homeTeam") if isinstance(game.get("homeTeam"), dict) else {}
    away_team = game.get("awayTeam") if isinstance(game.get("awayTeam"), dict) else {}

    if nhl_home == visit_home and nhl_away == visit_away:
        home_score = _score_from_team(home_team)
        away_score = _score_from_team(away_team)
    elif nhl_home == visit_away and nhl_away == visit_home:
        home_score = _score_from_team(away_team)
        away_score = _score_from_team(home_team)
    else:
        return VisitGameResponse(matched=False)

    game_state = game.get("gameState")
    state_str = str(game_state) if game_state is not None else None

    return VisitGameResponse(
        matched=True,
        nhl_game_id=game.get("id") if isinstance(game.get("id"), int) else None,
        away_score=away_score,
        home_score=home_score,
        game_state=state_str,
    )


async def lookup_game_for_visit(visit: VisitResponse) -> VisitGameResponse:
    """Fetch schedule for visit_date and match teams."""
    cache: dict[str, list[dict[str, Any]]] = {}
    await prefetch_schedules_for_dates({visit.visit_date}, cache)
    games = cache.get(visit.visit_date.isoformat(), [])
    game = find_game_for_matchup(
        games,
        visit.home_team.abbreviation,
        visit.away_team.abbreviation,
    )
    return game_to_visit_score(
        game,
        home_abbrev=visit.home_team.abbreviation,
        away_abbrev=visit.away_team.abbreviation,
    )


async def enrich_visits_with_game_scores(
    visits: list[VisitResponse],
) -> list[VisitResponse]:
    """Attach NHL scores; parallel fetch per unique visit_date in the batch."""
    if not visits:
        return visits

    cache: dict[str, list[dict[str, Any]]] = {}
    unique_dates = {visit.visit_date for visit in visits}
    await prefetch_schedules_for_dates(unique_dates, cache)

    enriched: list[VisitResponse] = []
    for visit in visits:
        games = cache.get(visit.visit_date.isoformat(), [])
        game = find_game_for_matchup(
            games,
            visit.home_team.abbreviation,
            visit.away_team.abbreviation,
        )
        score = game_to_visit_score(
            game,
            home_abbrev=visit.home_team.abbreviation,
            away_abbrev=visit.away_team.abbreviation,
        )
        enriched.append(visit.model_copy(update={"game": score}))

    return enriched
