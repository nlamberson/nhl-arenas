"""Tests for auth router endpoints."""

from unittest.mock import AsyncMock, patch

import pytest
from app.core.auth import FirebaseUser
from app.core.error_handlers import (
    api_exception_handler,
    integrity_error_handler,
    request_validation_handler,
)
from app.core.exceptions import APIException
from app.routers import auth as auth_router
from app.services.firebase_login import FirebaseLoginError
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from httpx import ASGITransport, AsyncClient
from sqlalchemy.exc import IntegrityError


@pytest.fixture
def auth_test_app() -> FastAPI:
    app = FastAPI()
    app.add_exception_handler(APIException, api_exception_handler)
    app.add_exception_handler(RequestValidationError, request_validation_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.include_router(auth_router.router)
    return app


@pytest.fixture
async def auth_client(auth_test_app: FastAPI) -> AsyncClient:
    transport = ASGITransport(app=auth_test_app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client


@pytest.mark.asyncio
async def test_register_success(auth_client: AsyncClient, test_db_user) -> None:
    firebase_data = {
        "idToken": "new-id-token",
        "refreshToken": "new-refresh-token",
        "expiresIn": "3600",
        "localId": "new-firebase-uid",
        "email": "new@example.com",
    }
    decoded = {
        "uid": "new-firebase-uid",
        "email": "new@example.com",
        "email_verified": False,
    }

    with (
        patch(
            "app.routers.auth.sign_up_with_password",
            new_callable=AsyncMock,
            return_value=firebase_data,
        ),
        patch("app.routers.auth.verify_firebase_token", return_value=decoded),
        patch(
            "app.routers.auth.get_or_create_user",
            new_callable=AsyncMock,
            return_value=test_db_user,
        ) as mock_get_or_create,
    ):
        response = await auth_client.post(
            "/api/v1/auth/register",
            json={"email": "new@example.com", "password": "secret12"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body == {
        "id_token": "new-id-token",
        "refresh_token": "new-refresh-token",
        "expires_in": 3600,
    }
    mock_get_or_create.assert_awaited_once()
    firebase_user = mock_get_or_create.await_args.args[1]
    assert isinstance(firebase_user, FirebaseUser)
    assert firebase_user.uid == "new-firebase-uid"


@pytest.mark.asyncio
async def test_register_email_exists(auth_client: AsyncClient) -> None:
    with patch(
        "app.routers.auth.sign_up_with_password",
        new_callable=AsyncMock,
        side_effect=FirebaseLoginError("EMAIL_EXISTS", code="EMAIL_EXISTS"),
    ):
        response = await auth_client.post(
            "/api/v1/auth/register",
            json={"email": "taken@example.com", "password": "secret12"},
        )

    assert response.status_code == 409
    assert response.json()["detail"] == "An account with this email already exists."


@pytest.mark.asyncio
async def test_register_weak_password(auth_client: AsyncClient) -> None:
    with patch(
        "app.routers.auth.sign_up_with_password",
        new_callable=AsyncMock,
        side_effect=FirebaseLoginError("WEAK_PASSWORD", code="WEAK_PASSWORD"),
    ):
        response = await auth_client.post(
            "/api/v1/auth/register",
            json={"email": "user@example.com", "password": "123"},
        )

    assert response.status_code == 422
    assert "6 characters" in response.json()["detail"]
