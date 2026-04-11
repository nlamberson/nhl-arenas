"""Authentication dependencies and utilities for FastAPI."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import UnauthorizedError
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
        UnauthorizedError: 401 if token is invalid or missing.
    """
    token = credentials.credentials
    
    try:
        decoded_token = verify_firebase_token(token)
        return FirebaseUser(decoded_token)
    except Exception as e:
        raise UnauthorizedError(
            detail=f"Invalid authentication credentials: {str(e)}",
        ) from e
