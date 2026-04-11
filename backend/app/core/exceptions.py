"""Domain exceptions mapped to HTTP responses via error handlers."""

from fastapi import status


class APIException(Exception):
    """Base exception for API errors with HTTP status and JSON ``detail``."""

    def __init__(
        self,
        status_code: int,
        detail: str | list,
        *,
        headers: dict[str, str] | None = None,
    ) -> None:
        self.status_code = status_code
        self.detail = detail
        self.headers = headers
        super().__init__(detail if isinstance(detail, str) else str(detail))


class ResourceNotFoundError(APIException):
    """Raised when a referenced resource does not exist."""

    def __init__(self, detail: str = "Resource not found") -> None:
        super().__init__(status.HTTP_404_NOT_FOUND, detail)


class VisitNotFoundError(ResourceNotFoundError):
    """Raised when a visit does not exist or does not belong to the current user."""

    def __init__(self) -> None:
        super().__init__("Visit not found")


class ValidationError(APIException):
    """Application-level validation failures (distinct from Pydantic request validation)."""

    def __init__(self, detail: str = "Validation error") -> None:
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, detail)


class UnauthorizedError(APIException):
    """Raised when authentication is missing or invalid."""

    def __init__(
        self,
        detail: str = "Not authenticated",
        *,
        headers: dict[str, str] | None = None,
    ) -> None:
        merged = {"WWW-Authenticate": "Bearer"}
        if headers:
            merged.update(headers)
        super().__init__(
            status.HTTP_401_UNAUTHORIZED,
            detail,
            headers=merged,
        )
