"""Unit tests for visit image path validation and router endpoints."""

import uuid
from datetime import datetime, timezone
from unittest.mock import AsyncMock, patch

import pytest
from app.core.auth import get_current_user
from app.core.exceptions import ConflictError, ValidationError
from app.db.session import get_db
from app.schemas.image import ImageCreate, ImageResponse
from app.services.images import validate_storage_path
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession


def test_validate_storage_path_accepts_valid_jpeg() -> None:
    uid = "firebase-uid-1"
    visit_id = uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
    validate_storage_path(
        f"visits/{uid}/{visit_id}/0.jpg",
        firebase_uid=uid,
        visit_id=visit_id,
        slot_index=0,
        mime_type="image/jpeg",
    )


def test_validate_storage_path_rejects_wrong_uid() -> None:
    visit_id = uuid.uuid4()
    with pytest.raises(ValidationError, match="storage_path must start"):
        validate_storage_path(
            f"visits/other/{visit_id}/0.jpg",
            firebase_uid="mine",
            visit_id=visit_id,
            slot_index=0,
            mime_type="image/jpeg",
        )


def test_validate_storage_path_rejects_slot_mismatch() -> None:
    uid = "u1"
    visit_id = uuid.uuid4()
    with pytest.raises(ValidationError, match="slot_index must match"):
        validate_storage_path(
            f"visits/{uid}/{visit_id}/2.png",
            firebase_uid=uid,
            visit_id=visit_id,
            slot_index=1,
            mime_type="image/png",
        )


def test_validate_storage_path_rejects_mime_ext_mismatch() -> None:
    uid = "u1"
    visit_id = uuid.uuid4()
    with pytest.raises(ValidationError, match="not allowed for extension"):
        validate_storage_path(
            f"visits/{uid}/{visit_id}/0.jpg",
            firebase_uid=uid,
            visit_id=visit_id,
            slot_index=0,
            mime_type="image/png",
        )


@pytest.fixture
def visits_client(visits_test_app, test_firebase_user, test_db_user):
    async def fake_db():
        yield AsyncMock(spec=AsyncSession)

    visits_test_app.dependency_overrides[get_current_user] = lambda: test_firebase_user
    visits_test_app.dependency_overrides[get_db] = fake_db

    with patch("app.routers.visits.get_or_create_user", new_callable=AsyncMock) as m_user:
        m_user.return_value = test_db_user
        with TestClient(visits_test_app) as client:
            yield client

    visits_test_app.dependency_overrides.clear()


def test_create_image_returns_201(visits_client: TestClient, test_db_user) -> None:
    visit_id = uuid.uuid4()
    image_id = uuid.uuid4()
    now = datetime.now(timezone.utc)
    created = ImageResponse(
        id=image_id,
        visit_id=visit_id,
        storage_path=f"visits/{test_db_user.firebase_uid}/{visit_id}/0.jpg",
        slot_index=0,
        mime_type="image/jpeg",
        file_size=1024,
        uploaded_at=now,
    )
    payload = ImageCreate(
        storage_path=created.storage_path,
        slot_index=0,
        mime_type="image/jpeg",
        file_size=1024,
    )

    with patch(
        "app.routers.visits.create_visit_image",
        new_callable=AsyncMock,
        return_value=created,
    ) as m:
        r = visits_client.post(
            f"/api/v1/visits/{visit_id}/images",
            json=payload.model_dump(mode="json"),
        )

    assert r.status_code == 201
    assert r.json()["id"] == str(image_id)
    m.assert_awaited_once()


def test_create_image_conflict_returns_409(visits_client: TestClient) -> None:
    visit_id = uuid.uuid4()
    with patch(
        "app.routers.visits.create_visit_image",
        new_callable=AsyncMock,
        side_effect=ConflictError("slot_index 0 is already taken for this visit"),
    ):
        r = visits_client.post(
            f"/api/v1/visits/{visit_id}/images",
            json={
                "storage_path": f"visits/firebase-test-uid/{visit_id}/0.jpg",
                "slot_index": 0,
                "mime_type": "image/jpeg",
                "file_size": 100,
            },
        )

    assert r.status_code == 409


def test_delete_image_returns_204(visits_client: TestClient) -> None:
    visit_id = uuid.uuid4()
    image_id = uuid.uuid4()
    with patch(
        "app.routers.visits.delete_visit_image_by_id",
        new_callable=AsyncMock,
    ) as m:
        r = visits_client.delete(f"/api/v1/visits/{visit_id}/images/{image_id}")

    assert r.status_code == 204
    m.assert_awaited_once()
