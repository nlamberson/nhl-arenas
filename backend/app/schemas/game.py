"""NHL game data attached to visits (from api-web.nhle.com)."""

from typing import Optional

from pydantic import BaseModel


class VisitGameResponse(BaseModel):
    """NHL game/score lookup for a visit's teams on visit_date (API response)."""

    matched: bool = False
    nhl_game_id: Optional[int] = None
    away_score: Optional[int] = None
    home_score: Optional[int] = None
    game_state: Optional[str] = None
