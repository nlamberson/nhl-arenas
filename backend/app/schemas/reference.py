"""Pydantic schemas for reference data (teams, arenas)."""

import uuid
from typing import Optional

from pydantic import ConfigDict, BaseModel


class ArenaResponse(BaseModel):
    """Arena/venue response for API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    city: Optional[str] = None
    capacity: Optional[int] = None


class TeamResponse(BaseModel):
    """Team response for API."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    abbreviation: str
    city: Optional[str] = None
