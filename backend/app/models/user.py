"""User model for storing user information in PostgreSQL."""

from datetime import datetime

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.db.base import Base


class User(Base):
    """
    User model to store additional user information beyond Firebase.
    
    Firebase handles authentication, but we store user data here for:
    - Relational data (visits, favorites, etc.)
    - Additional profile information
    - Tracking user activity
    """
    
    __tablename__ = "users"
    
    # Firebase UID is the primary key (unique identifier from Firebase)
    firebase_uid: Mapped[str] = mapped_column(String(128), primary_key=True, index=True)
    
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
    
    def __repr__(self) -> str:
        return f"User(firebase_uid={self.firebase_uid}, email={self.email})"

