"""Domain-level exceptions mapped to HTTP responses in main."""


class VisitNotFoundError(Exception):
    """Raised when a visit does not exist or does not belong to the current user."""
