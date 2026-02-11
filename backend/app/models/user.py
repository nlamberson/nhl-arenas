"""User model for storing user information in PostgreSQL."""

import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.db.base import Base


class User(Base):
    """
    User model to store additional user information beyond Firebase.
    
    Firebase handles authentication, but we store user data here for:
    - Relational data (visits, favorites, etc.)
    - Additional profile information
    - Tracking user activity
    
    Internal app references use id (UUID). Auth lookups use firebase_uid.
    """
    
    __tablename__ = "users"
    
    # Internal user id for app-wide references (APIs, FKs, visits, etc.)
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        server_default=text("gen_random_uuid()"),
    )
    # Firebase UID for auth; unique, indexed (lookup by Firebase token)
    firebase_uid: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    
    # User information from Firebase
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    display_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    
    # Additional user preferences/data
    # Add any additional fields you want to track, like:
    # favorite_team_id: Mapped[int | None] = mapped_column(ForeignKey("teams.id"), nullable=True)
    # notification_enabled: Mapped[bool] = mapped_column(default=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), 
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    visits: Mapped[list["Visit"]] = relationship(
        "Visit",
        back_populates="user",
    )
    
    def __repr__(self) -> str:
        return f"User(id={self.id}, firebase_uid={self.firebase_uid}, email={self.email})"

