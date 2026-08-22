"""Image model for visit photos."""

import uuid
from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base

MAX_IMAGES_PER_VISIT = 5
SLOT_INDEX_MIN = 0
SLOT_INDEX_MAX = 4


class Image(Base):
    """
    Image attached to a visit. Bytes live in Firebase Storage; this row is metadata only.
    """

    __tablename__ = "images"
    __table_args__ = (
        UniqueConstraint("visit_id", "slot_index", name="uq_images_visit_id_slot_index"),
        CheckConstraint(
            f"slot_index >= {SLOT_INDEX_MIN} AND slot_index <= {SLOT_INDEX_MAX}",
            name="ck_images_slot_index_range",
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    visit_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("visits.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    slot_index: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_size: Mapped[int] = mapped_column(Integer, nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    visit: Mapped["Visit"] = relationship("Visit", back_populates="images")
    user: Mapped["User"] = relationship("User")

    def __repr__(self) -> str:
        return (
            f"Image(id={self.id}, visit_id={self.visit_id}, "
            f"slot_index={self.slot_index})"
        )
