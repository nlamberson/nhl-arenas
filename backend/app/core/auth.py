"""Authentication dependencies and utilities for FastAPI."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.firebase import verify_firebase_token

# HTTP Bearer token scheme for extracting Authorization header
security = HTTPBearer()


class FirebaseUser:
    """Represents an authenticated Firebase user."""
    
    def __init__(self, decoded_token: dict):
        self.uid: str = decoded_token.get("uid", "")
        self.email: str | None = decoded_token.get("email")
        self.email_verified: bool = decoded_token.get("email_verified", False)
        self.name: str | None = decoded_token.get("name")
        self.picture: str | None = decoded_token.get("picture")
        self.firebase_claims: dict = decoded_token
    
    def __repr__(self) -> str:
        return f"FirebaseUser(uid={self.uid}, email={self.email})"


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> FirebaseUser:
    """
    Dependency to get the current authenticated user from Firebase token.
    
    Usage in FastAPI endpoints:
        @app.get("/protected")
        async def protected_route(user: FirebaseUser = Depends(get_current_user)):
            return {"message": f"Hello {user.email}"}
    
    Args:
        credentials: HTTP Bearer credentials from the Authorization header.
        
    Returns:
        FirebaseUser object containing user information.
        
    Raises:
        HTTPException: 401 if token is invalid or missing.
    """
    token = credentials.credentials
    
    try:
        decoded_token = verify_firebase_token(token)
        return FirebaseUser(decoded_token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials | None = Depends(HTTPBearer(auto_error=False))
) -> FirebaseUser | None:
    """
    Optional authentication dependency - returns None if no token provided.
    
    Useful for endpoints that work differently for authenticated vs anonymous users.
    
    Usage:
        @app.get("/optional-auth")
        async def optional_route(user: FirebaseUser | None = Depends(get_current_user_optional)):
            if user:
                return {"message": f"Hello {user.email}"}
            return {"message": "Hello anonymous user"}
    """
    if credentials is None:
        return None
    
    try:
        decoded_token = verify_firebase_token(credentials.credentials)
        return FirebaseUser(decoded_token)
    except Exception:
        return None

