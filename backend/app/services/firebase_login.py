"""Firebase Identity Toolkit REST API - email/password sign-in and sign-up."""

import logging

import httpx

logger = logging.getLogger(__name__)

FIREBASE_SIGN_IN_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
FIREBASE_SIGN_UP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signUp"
FIREBASE_SIGN_IN_IDP_URL = "https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp"


class FirebaseLoginError(Exception):
    """Raised when Firebase sign-in fails (invalid credentials, etc.)."""

    def __init__(self, message: str, code: str | None = None):
        self.message = message
        self.code = code
        super().__init__(message)


async def _email_password_request(
    *,
    url: str,
    api_key: str,
    email: str,
    password: str,
    action: str,
) -> dict:
    if not api_key:
        raise FirebaseLoginError("Firebase API key is not configured", code="CONFIG_ERROR")

    payload = {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{url}?key={api_key}", json=payload)

    if response.is_success:
        data = response.json()
        logger.debug(f"Firebase {action} successful for {email}")
        return data

    try:
        err_body = response.json()
        error = err_body.get("error", {})
        msg = error.get("message", response.text)
        code = error.get("message")
    except Exception:
        msg = response.text or f"HTTP {response.status_code}"
        code = None

    logger.warning(f"Firebase {action} failed for {email}: {code or msg}")
    raise FirebaseLoginError(msg, code=code)


async def sign_in_with_password(api_key: str, email: str, password: str) -> dict:
    """
    Sign in with email/password via Firebase Identity Toolkit REST API.

    Returns the raw response dict with idToken, refreshToken, expiresIn, etc.
    Raises FirebaseLoginError on invalid credentials or other auth errors.
    """
    return await _email_password_request(
        url=FIREBASE_SIGN_IN_URL,
        api_key=api_key,
        email=email,
        password=password,
        action="sign-in",
    )


async def sign_in_with_google_id_token(api_key: str, google_id_token: str) -> dict:
    """
    Exchange a Google ID token for Firebase Auth tokens via Identity Toolkit REST API.

    Returns the raw response dict with idToken, refreshToken, expiresIn, localId, etc.
    Raises FirebaseLoginError on invalid tokens or disabled Google provider.
    """
    if not api_key:
        raise FirebaseLoginError("Firebase API key is not configured", code="CONFIG_ERROR")

    payload = {
        "postBody": f"id_token={google_id_token}&providerId=google.com",
        "requestUri": "http://localhost",
        "returnIdpCredential": True,
        "returnSecureToken": True,
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(f"{FIREBASE_SIGN_IN_IDP_URL}?key={api_key}", json=payload)

    if response.is_success:
        data = response.json()
        logger.debug("Firebase Google sign-in successful")
        return data

    try:
        err_body = response.json()
        error = err_body.get("error", {})
        msg = error.get("message", response.text)
        code = error.get("message")
    except Exception:
        msg = response.text or f"HTTP {response.status_code}"
        code = None

    logger.warning(f"Firebase Google sign-in failed: {code or msg}")
    raise FirebaseLoginError(msg, code=code)


async def sign_up_with_password(api_key: str, email: str, password: str) -> dict:
    """
    Create a Firebase Auth user with email/password via Identity Toolkit REST API.

    Returns the raw response dict with idToken, refreshToken, expiresIn, localId, etc.
    Raises FirebaseLoginError on duplicate email, weak password, or other auth errors.
    """
    return await _email_password_request(
        url=FIREBASE_SIGN_UP_URL,
        api_key=api_key,
        email=email,
        password=password,
        action="sign-up",
    )
