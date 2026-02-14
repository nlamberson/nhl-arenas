"""Arena model for NHL venues."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Arena(Base):
    """
    NHL arena/venue for tracking visits.
    """

    __tablename__ = "arenas"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    teams: Mapped[list["Team"]] = relationship(
        "Team",
        back_populates="arena",
        foreign_keys="Team.arena_id",
    )

    def __repr__(self) -> str:
        return f"Arena(id={self.id}, name={self.name})"
