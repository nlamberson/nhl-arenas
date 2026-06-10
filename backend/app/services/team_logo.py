"""Fetch NHL team logo SVGs from the league CDN (server-side; avoids browser CORS)."""

import re

import httpx

from app.core.exceptions import ResourceNotFoundError, ValidationError

NHL_LOGO_CDN = "https://assets.nhle.com/logos/nhl/svg"
_ABBR_PATTERN = re.compile(r"^[A-Z]{2,4}$")
_LOGO_TIMEOUT = httpx.Timeout(10.0)


def normalize_logo_abbreviation(abbreviation: str) -> str:
    """Uppercase team abbreviation for CDN paths."""
    return abbreviation.strip().upper()


def normalize_logo_variant(variant: str) -> str:
    """Validate logo color variant (`light` or `dark`)."""
    normalized = variant.strip().lower()
    if normalized not in ("light", "dark"):
        raise ValidationError("variant must be 'light' or 'dark'")
    return normalized


def nhl_team_logo_url(abbreviation: str, variant: str) -> str:
    """Build the upstream NHL assets URL for a team logo SVG."""
    abbr = normalize_logo_abbreviation(abbreviation)
    if not _ABBR_PATTERN.match(abbr):
        raise ValidationError("abbreviation must be 2–4 letters")
    logo_variant = normalize_logo_variant(variant)
    return f"{NHL_LOGO_CDN}/{abbr}_{logo_variant}.svg"


async def fetch_team_logo_svg(abbreviation: str, variant: str = "light") -> bytes:
    """Download team logo SVG bytes from the NHL CDN."""
    url = nhl_team_logo_url(abbreviation, variant)
    async with httpx.AsyncClient(timeout=_LOGO_TIMEOUT) as client:
        try:
            response = await client.get(url)
        except httpx.HTTPError as exc:
            raise ResourceNotFoundError("Team logo unavailable") from exc

    if response.status_code == 404:
        raise ResourceNotFoundError("Team logo not found")
    if response.status_code >= 400:
        raise ResourceNotFoundError("Team logo unavailable")

    return response.content
