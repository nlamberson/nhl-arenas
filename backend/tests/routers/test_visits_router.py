"""Unit tests for visits router (dependency overrides + patched services)."""

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from app.core.auth import get_current_user
from app.core.exceptions import VisitNotFoundError
from app.db.session import get_db
from app.schemas.visit import VisitCreate
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from tests.conftest import sample_visit_response


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


def test_get_visits_returns_list_and_total_header(visits_client: TestClient) -> None:
    vr = sample_visit_response()
    with patch("app.routers.visits.get_users_visits", new_callable=AsyncMock) as m:
        m.return_value = ([vr], 42)
        r = visits_client.get("/api/v1/visits")

    assert r.status_code == 200
    assert r.headers.get("X-Total-Count") == "42"
    data = r.json()
    assert len(data) == 1
    assert data[0]["id"] == str(vr.id)


def test_get_visit_returns_single(visits_client: TestClient) -> None:
    vr = sample_visit_response()
    with patch("app.routers.visits.get_visit_by_id_for_user", new_callable=AsyncMock) as m:
        m.return_value = vr
        r = visits_client.get(f"/api/v1/visits/{vr.id}")

    assert r.status_code == 200
    assert r.json()["id"] == str(vr.id)


def test_get_visit_not_found_returns_404(visits_client: TestClient) -> None:
    vid = uuid.uuid4()
    with patch("app.routers.visits.get_visit_by_id_for_user", new_callable=AsyncMock) as m:
        m.side_effect = VisitNotFoundError()
        r = visits_client.get(f"/api/v1/visits/{vid}")

    assert r.status_code == 404
    assert r.json()["detail"] == "Visit not found"


def test_create_visit_returns_201(visits_client: TestClient) -> None:
    vr = sample_visit_response()
    body = {
        "home_team_id": str(vr.home_team.id),
        "away_team_id": str(vr.away_team.id),
        "arena_id": str(vr.arena.id),
        "visit_date": vr.visit_date.isoformat(),
        "seating_location": "400",
    }
    with patch("app.routers.visits.create_new_visit", new_callable=AsyncMock) as m:
        m.return_value = vr
        r = visits_client.post("/api/v1/visits", json=body)

    assert r.status_code == 201
    assert r.json()["id"] == str(vr.id)
    m.assert_awaited_once()
    call_visit = m.await_args[0][0]
    assert isinstance(call_visit, VisitCreate)


def test_patch_visit_returns_200(visits_client: TestClient) -> None:
    vr = sample_visit_response()
    payload = {"seating_location": "500"}
    with patch("app.routers.visits.update_visit_for_user", new_callable=AsyncMock) as m:
        m.return_value = vr
        r = visits_client.patch(f"/api/v1/visits/{vr.id}", json=payload)

    assert r.status_code == 200
    m.assert_awaited_once()


def test_patch_visit_not_found_returns_404(visits_client: TestClient) -> None:
    vid = uuid.uuid4()
    with patch("app.routers.visits.update_visit_for_user", new_callable=AsyncMock) as m:
        m.side_effect = VisitNotFoundError()
        r = visits_client.patch(f"/api/v1/visits/{vid}", json={"seating_location": "x"})

    assert r.status_code == 404


def test_delete_visit_returns_204(visits_client: TestClient) -> None:
    vid = uuid.uuid4()
    with patch("app.routers.visits.delete_visit_by_id", new_callable=AsyncMock) as m:
        r = visits_client.delete(f"/api/v1/visits/{vid}")

    assert r.status_code == 204
    assert r.content == b""
    m.assert_awaited_once()
