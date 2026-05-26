"""Authentication-related API endpoints."""

from app.core.auth import FirebaseUser, get_current_user
from app.core.config import get_settings
from app.core.firebase import verify_firebase_token
from app.db.session import get_db
from app.schemas.auth import LoginRequest, LoginResponse, RegisterRequest
from app.services.auth_errors import raise_auth_http_error
from app.services.firebase_login import (FirebaseLoginError,
                                         sign_in_with_password,
                                         sign_up_with_password)
from app.services.user_service import get_or_create_user
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _login_response_from_firebase(data: dict) -> LoginResponse:
    return LoginResponse(
        id_token=data["idToken"],
        refresh_token=data["refreshToken"],
        expires_in=int(data["expiresIn"]),
    )


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
        raise_auth_http_error(e, register=False)

    return _login_response_from_firebase(data)


@router.post(
    "/register",
    response_model=LoginResponse,
    summary="Register with email and password",
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> LoginResponse:
    """
    Create a Firebase Auth account and sync the user into the application database.

    Returns the same token payload as login. The client may call GET /auth/me afterward
    to load profile fields; the database row is created during this request.
    """
    settings = get_settings()
    try:
        data = await sign_up_with_password(
            api_key=settings.firebase_api_key,
            email=body.email,
            password=body.password,
        )
    except FirebaseLoginError as e:
        raise_auth_http_error(e, register=True)

    decoded = verify_firebase_token(data["idToken"])
    await get_or_create_user(db, FirebaseUser(decoded))

    return _login_response_from_firebase(data)


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

