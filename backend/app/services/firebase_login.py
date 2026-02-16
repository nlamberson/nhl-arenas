"""Firebase Identity Toolkit REST API - email/password sign-in."""

import logging

import httpx

logger = logging.getLogger(__name__)

FIREBASE_AUTH_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"


class FirebaseLoginError(Exception):
    """Raised when Firebase sign-in fails (invalid credentials, etc.)."""

    def __init__(self, message: str, code: str | None = None):
        self.message = message
        self.code = code
        super().__init__(message)


async def sign_in_with_password(api_key: str, email: str, password: str) -> dict:
    """
    Sign in with email/password via Firebase Identity Toolkit REST API.

    Returns the raw response dict with idToken, refreshToken, expiresIn, etc.
    Raises FirebaseLoginError on invalid credentials or other auth errors.
    """
    if not api_key:
        raise FirebaseLoginError("Firebase API key is not configured", code="CONFIG_ERROR")

    url = f"{FIREBASE_AUTH_URL}?key={api_key}"
    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)

    if response.is_success:
        data = response.json()
        logger.debug(f"Firebase sign-in successful for {email}")
        return data

    # Parse error from Firebase (error.message is the code string, e.g. INVALID_LOGIN_CREDENTIALS)
    try:
        err_body = response.json()
        error = err_body.get("error", {})
        msg = error.get("message", response.text)
        code = error.get("message")  # Firebase uses "message" for the error code string
    except Exception:
        msg = response.text or f"HTTP {response.status_code}"
        code = None

    logger.warning(f"Firebase sign-in failed for {email}: {code or msg}")
    raise FirebaseLoginError(msg, code=code)
