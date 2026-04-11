"""Shared fixtures for backend tests."""

import uuid
from datetime import date, datetime, timezone

import pytest
from app.core.auth import FirebaseUser
from app.core.error_handlers import (
    api_exception_handler,
    integrity_error_handler,
    request_validation_handler,
)
from app.core.exceptions import APIException
from app.models import Arena, Team, User, Visit
from app.routers import visits as visits_router
from app.schemas.reference import ArenaResponse, TeamResponse
from app.schemas.visit import VisitResponse
from fastapi import FastAPI
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError


@pytest.fixture
def test_user_id() -> uuid.UUID:
    return uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")


@pytest.fixture
def test_firebase_user() -> FirebaseUser:
    return FirebaseUser(
        {
            "uid": "firebase-test-uid",
            "email": "test@example.com",
            "email_verified": True,
        }
    )


@pytest.fixture
def test_db_user(test_user_id: uuid.UUID) -> User:
    now = datetime.now(timezone.utc)
    return User(
        id=test_user_id,
        firebase_uid="firebase-test-uid",
        email="test@example.com",
        display_name="Test User",
        photo_url=None,
        created_at=now,
        updated_at=now,
    )


def build_team(team_id: uuid.UUID, name: str = "Home Team", abbr: str = "HOM") -> Team:
    now = datetime.now(timezone.utc)
    return Team(
        id=team_id,
        name=name,
        abbreviation=abbr,
        city="City",
        arena_id=None,
        created_at=now,
    )


def build_arena(arena_id: uuid.UUID, name: str = "Test Arena") -> Arena:
    now = datetime.now(timezone.utc)
    return Arena(
        id=arena_id,
        name=name,
        city="City",
        capacity=18000,
        created_at=now,
    )


def build_visit_with_relations(
    *,
    visit_id: uuid.UUID,
    user_id: uuid.UUID,
    home_team: Team,
    away_team: Team,
    arena: Arena,
    visit_date: date | None = None,
    seating_location: str | None = "101",
) -> Visit:
    now = datetime.now(timezone.utc)
    vd = visit_date or date(2024, 1, 15)
    visit = Visit(
        id=visit_id,
        user_id=user_id,
        arena_id=arena.id,
        home_team_id=home_team.id,
        away_team_id=away_team.id,
        visit_date=vd,
        seating_location=seating_location,
        created_at=now,
        updated_at=now,
    )
    visit.home_team = home_team
    visit.away_team = away_team
    visit.arena = arena
    return visit


def sample_visit_response(visit_id: uuid.UUID | None = None) -> VisitResponse:
    tid_a = uuid.UUID("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb")
    tid_b = uuid.UUID("cccccccc-cccc-cccc-cccc-cccccccccccc")
    aid = uuid.UUID("dddddddd-dddd-dddd-dddd-dddddddddddd")
    now = datetime.now(timezone.utc)
    vid = visit_id or uuid.UUID("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
    return VisitResponse(
        id=vid,
        home_team=TeamResponse(
            id=tid_a, name="Home", abbreviation="HOM", city="H"
        ),
        away_team=TeamResponse(
            id=tid_b, name="Away", abbreviation="AWY", city="A"
        ),
        arena=ArenaResponse(id=aid, name="Arena", city="C", capacity=10000),
        visit_date=date(2024, 3, 1),
        seating_location="200",
        created_at=now,
        updated_at=now,
    )


@pytest.fixture
def visits_test_app() -> FastAPI:
    app = FastAPI()
    app.add_exception_handler(APIException, api_exception_handler)
    app.add_exception_handler(RequestValidationError, request_validation_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.include_router(visits_router.router)
    return app
