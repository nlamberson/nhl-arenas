"""Team model for NHL teams."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class Team(Base):
    """
    NHL team for visit home/away tracking.
    """

    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    abbreviation: Mapped[str] = mapped_column(String(3), nullable=False)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    arena_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("arenas.id"),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    arena: Mapped["Arena | None"] = relationship("Arena", back_populates="teams")

    def __repr__(self) -> str:
        return f"Team(id={self.id}, name={self.name}, abbreviation={self.abbreviation})"
