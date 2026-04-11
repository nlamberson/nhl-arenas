"""Authentication-related API endpoints."""

from app.core.auth import FirebaseUser, get_current_user
from app.core.config import get_settings
from app.core.exceptions import UnauthorizedError
from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse
from app.services.firebase_login import (FirebaseLoginError,
                                         sign_in_with_password)
from app.services.user_service import get_or_create_user
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse, summary="Login with email and password")
async def login(body: LoginRequest) -> LoginResponse:
    """
    Exchange email/password for a Firebase ID token (JWT) and refresh token.

    The frontend should store the id_token and send it in the Authorization header
    as "Bearer <id_token>" for protected endpoints. Use refresh_token to obtain
    a new id_token when it expires (e.g. via Firebase REST refresh endpoint).
    """
    settings = get_settings()
    try:
        data = await sign_in_with_password(
            api_key=settings.firebase_api_key,
            email=body.email,
            password=body.password,
        )
    except FirebaseLoginError as e:
        detail = e.message
        if e.code and e.code != e.message:
            detail = f"{e.message} (code: {e.code})"
        raise UnauthorizedError(detail=detail) from e

    return LoginResponse(
        id_token=data["idToken"],
        refresh_token=data["refreshToken"],
        expires_in=int(data["expiresIn"]),
    )


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

