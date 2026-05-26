"""Unit tests for NHL game score lookup."""

from datetime import date

import pytest
from app.schemas.game import VisitGameResponse
from app.services import nhl_game_lookup as lookup


def test_find_game_for_matchup_direct() -> None:
    games = [
        {
            "id": 2023021031,
            "gameState": "OFF",
            "homeTeam": {"abbrev": "BUF", "score": 7},
            "awayTeam": {"abbrev": "DET", "score": 3},
        }
    ]
    found = lookup.find_game_for_matchup(games, "BUF", "DET")
    assert found is not None
    assert found["id"] == 2023021031


def test_find_game_for_matchup_swapped_teams() -> None:
    games = [
        {
            "id": 1,
            "homeTeam": {"abbrev": "TOR", "score": 2},
            "awayTeam": {"abbrev": "BOS", "score": 5},
        }
    ]
    found = lookup.find_game_for_matchup(games, "BOS", "TOR")
    assert found is not None


def test_game_to_visit_score_maps_swapped_nhl_home_away() -> None:
    game = {
        "id": 99,
        "gameState": "OFF",
        "homeTeam": {"abbrev": "TOR", "score": 2},
        "awayTeam": {"abbrev": "BOS", "score": 5},
    }
    score = lookup.game_to_visit_score(game, home_abbrev="BOS", away_abbrev="TOR")
    assert score.matched is True
    assert score.home_score == 5
    assert score.away_score == 2
    assert score.nhl_game_id == 99


def test_game_to_visit_score_no_match() -> None:
    score = lookup.game_to_visit_score(None, home_abbrev="BOS", away_abbrev="TOR")
    assert score == VisitGameResponse(matched=False)


@pytest.mark.asyncio
async def test_prefetch_schedules_fetches_missing_dates_in_parallel(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    cache: dict[str, list] = {}
    calls: list[str] = []

    class FakeResponse:
        def raise_for_status(self) -> None:
            pass

        def json(self) -> dict:
            return {"gameWeek": [{"games": [{"id": 1, "homeTeam": {"abbrev": "A"}}]}]}

    class FakeClient:
        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *args: object) -> None:
            pass

        async def get(self, url: str) -> FakeResponse:
            calls.append(url)
            return FakeResponse()

    monkeypatch.setattr(lookup.httpx, "AsyncClient", lambda **kwargs: FakeClient())

    await lookup.prefetch_schedules_for_dates(
        {date(2024, 3, 12), date(2024, 3, 13)},
        cache,
    )
    assert len(calls) == 2
    assert "2024-03-12" in cache
    assert "2024-03-13" in cache


@pytest.mark.asyncio
async def test_fetch_schedule_for_date_uses_cache(monkeypatch: pytest.MonkeyPatch) -> None:
    cache: dict[str, list] = {}
    calls = 0

    async def fake_get(url: str) -> object:
        nonlocal calls
        calls += 1

        class FakeResponse:
            def raise_for_status(self) -> None:
                pass

            def json(self) -> dict:
                return {
                    "gameWeek": [
                        {
                            "date": "2024-03-12",
                            "games": [
                                {
                                    "id": 1,
                                    "homeTeam": {"abbrev": "BUF"},
                                    "awayTeam": {"abbrev": "DET"},
                                }
                            ],
                        }
                    ]
                }

        return FakeResponse()

    class FakeClient:
        async def __aenter__(self) -> "FakeClient":
            return self

        async def __aexit__(self, *args: object) -> None:
            pass

        async def get(self, url: str) -> object:
            return await fake_get(url)

    monkeypatch.setattr(lookup.httpx, "AsyncClient", lambda **kwargs: FakeClient())

    games1 = await lookup.fetch_schedule_for_date(date(2024, 3, 12), cache)
    games2 = await lookup.fetch_schedule_for_date(date(2024, 3, 12), cache)
    assert len(games1) == 1
    assert games1 == games2
    assert calls == 1
