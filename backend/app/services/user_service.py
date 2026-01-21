"""Service layer for user operations."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import FirebaseUser
from app.models.user import User


async def get_or_create_user(
    db: AsyncSession, 
    firebase_user: FirebaseUser
) -> User:
    """
    Get an existing user or create a new one from Firebase authentication.
    
    This should be called after a user successfully authenticates with Firebase.
    It ensures the user exists in your local database.
    
    Args:
        db: Database session
        firebase_user: Authenticated Firebase user from the token
        
    Returns:
        User model instance
    """
    # Try to get existing user
    stmt = select(User).where(User.firebase_uid == firebase_user.uid)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user:
        # Update user information in case it changed in Firebase
        user.email = firebase_user.email or user.email
        user.display_name = firebase_user.name or user.display_name
        user.photo_url = firebase_user.picture or user.photo_url
        await db.commit()
        await db.refresh(user)
        return user
    
    # Create new user
    new_user = User(
        firebase_uid=firebase_user.uid,
        email=firebase_user.email or "",
        display_name=firebase_user.name,
        photo_url=firebase_user.picture,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user


async def get_user_by_firebase_uid(db: AsyncSession, firebase_uid: str) -> User | None:
    """Get a user by their Firebase UID."""
    stmt = select(User).where(User.firebase_uid == firebase_uid)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def update_user_profile(
    db: AsyncSession,
    firebase_uid: str,
    display_name: str | None = None,
    # Add other fields you want to allow updating
) -> User | None:
    """Update user profile information."""
    user = await get_user_by_firebase_uid(db, firebase_uid)
    
    if not user:
        return None
    
    if display_name is not None:
        user.display_name = display_name
    
    await db.commit()
    await db.refresh(user)
    return user

