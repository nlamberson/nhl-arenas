"""Tests for reference router endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from app.core.error_handlers import (
    api_exception_handler,
    integrity_error_handler,
    request_validation_handler,
)
from app.core.exceptions import APIException
from app.routers import reference as reference_router
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import IntegrityError


@pytest.fixture
def reference_test_app() -> FastAPI:
    app = FastAPI()
    app.add_exception_handler(APIException, api_exception_handler)
    app.add_exception_handler(RequestValidationError, request_validation_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.include_router(reference_router.router)
    return app


@pytest.fixture
async def reference_client(reference_test_app: FastAPI) -> AsyncClient:
    transport = ASGITransport(app=reference_test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_get_team_logo_returns_svg(reference_client: AsyncClient) -> None:
    svg = b'<svg xmlns="http://www.w3.org/2000/svg"></svg>'
    with patch(
        "app.routers.reference.fetch_team_logo_svg",
        new=AsyncMock(return_value=svg),
    ):
        response = await reference_client.get(
            "/api/v1/reference/team-logos/BOS",
            params={"variant": "light"},
        )

    assert response.status_code == 200
    assert response.content == svg
    assert response.headers["content-type"].startswith("image/svg+xml")
    assert response.headers["cache-control"] == "public, max-age=86400"


@pytest.mark.asyncio
async def test_get_team_logo_invalid_abbreviation(reference_client: AsyncClient) -> None:
    response = await reference_client.get("/api/v1/reference/team-logos/BOS123")

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_get_team_logo_invalid_variant(reference_client: AsyncClient) -> None:
    response = await reference_client.get(
        "/api/v1/reference/team-logos/BOS",
        params={"variant": "neon"},
    )

    assert response.status_code == 422
