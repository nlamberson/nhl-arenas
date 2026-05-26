"""Map Firebase Identity Toolkit error codes to HTTP API exceptions."""

from app.core.exceptions import ConflictError, UnauthorizedError, ValidationError
from app.services.firebase_login import FirebaseLoginError

_REGISTER_MESSAGES: dict[str, str] = {
    "EMAIL_EXISTS": "An account with this email already exists.",
    "WEAK_PASSWORD": "Password must be at least 6 characters.",
    "INVALID_EMAIL": "Enter a valid email address.",
    "OPERATION_NOT_ALLOWED": "Email/password sign-up is not enabled for this project.",
}


def raise_auth_http_error(error: FirebaseLoginError, *, register: bool = False) -> None:
    """Translate FirebaseLoginError into an appropriate HTTP exception."""
    code = error.code or ""
    if register and code in _REGISTER_MESSAGES:
        detail = _REGISTER_MESSAGES[code]
    else:
        detail = error.message
        if code and code != error.message:
            detail = f"{error.message} (code: {code})"

    if register and code == "EMAIL_EXISTS":
        raise ConflictError(detail=detail) from error
    if register and code in ("WEAK_PASSWORD", "INVALID_EMAIL", "OPERATION_NOT_ALLOWED"):
        raise ValidationError(detail=detail) from error
    raise UnauthorizedError(detail=detail) from error
