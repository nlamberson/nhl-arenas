"""Pydantic schemas for visit image metadata."""

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ImageCreate(BaseModel):
    """Metadata recorded after a successful direct upload to Firebase Storage."""

    storage_path: str = Field(..., min_length=1, max_length=500)
    slot_index: int = Field(..., ge=0, le=4)
    mime_type: str = Field(..., min_length=1, max_length=50)
    file_size: int = Field(..., gt=0)


class ImageResponse(BaseModel):
    """Image metadata returned to clients (no download URLs)."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    visit_id: uuid.UUID
    storage_path: str
    slot_index: int
    mime_type: str
    file_size: int
    uploaded_at: datetime
