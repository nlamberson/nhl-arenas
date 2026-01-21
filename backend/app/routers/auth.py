"""Authentication-related API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import FirebaseUser, get_current_user
from app.db.session import get_db
from app.services.user_service import get_or_create_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/me", summary="Get current user information")
async def get_me(
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get information about the currently authenticated user.
    
    This endpoint requires authentication - the client must send a Firebase ID token
    in the Authorization header: "Bearer <firebase-id-token>"
    
    On first call, creates the user in the database. On subsequent calls, updates
    the user's info if it changed in Firebase.
    """
    # Get or create user in database
    user = await get_or_create_user(db, firebase_user)
    
    return {
        "uid": user.firebase_uid,
        "email": user.email,
        "email_verified": firebase_user.email_verified,
        "display_name": user.display_name,
        "photo_url": user.photo_url,
        "created_at": user.created_at.isoformat(),
    }


@router.post("/verify", summary="Verify a Firebase token")
async def verify_token(user: FirebaseUser = Depends(get_current_user)) -> dict:
    """
    Verify that a Firebase ID token is valid.
    
    Returns success if the token is valid and not expired.
    Note: This does NOT create/update the user in the database. Use /auth/me for that.
    """
    return {
        "valid": True,
        "uid": user.uid,
        "email": user.email,
    }

