"""Authentication request/response schemas."""

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    """Credentials for email/password login."""

    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """JWT and refresh token returned after successful login."""

    id_token: str
    refresh_token: str
    expires_in: int  # seconds until id_token expires
