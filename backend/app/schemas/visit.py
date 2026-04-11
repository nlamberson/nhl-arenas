"""Pydantic schemas for visit data."""

import uuid
from datetime import date, datetime
from typing import Optional

from app.schemas.reference import ArenaResponse, TeamResponse
from pydantic import BaseModel, ConfigDict


# Request Objects
class VisitCreate(BaseModel):
    """Request data needed to create a new visit."""

    home_team_id: uuid.UUID
    away_team_id: uuid.UUID
    arena_id: uuid.UUID
    visit_date: date
    seating_location: Optional[str] = None
    # TODO: Optional[list[ImageCreate]] for images

class VisitUpdate(BaseModel):
    """Request data needed to update a visit."""

    home_team_id: Optional[uuid.UUID] = None
    away_team_id: Optional[uuid.UUID] = None
    arena_id: Optional[uuid.UUID] = None
    visit_date: Optional[date] = None
    seating_location: Optional[str] = None
    # TODO: Optional[list[ImageUpdate]] for images

# Response Objects
class VisitResponse(BaseModel):
    """Response data for a visit."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    home_team: TeamResponse
    away_team: TeamResponse
    arena: ArenaResponse
    visit_date: date
    seating_location: Optional[str] = None
    # TODO: Optional[list[ImageResponse]] for images
    created_at: datetime
    updated_at: datetime