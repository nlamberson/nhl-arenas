"""Aggregate visit stats for profile/home."""

from pydantic import BaseModel


class VisitStatsResponse(BaseModel):
    """SQL-derived counters for the current user's visits."""

    total_visits: int
    teams_seen: int
    arenas_visited: int
