"""Router for /visits endpoints."""

import logging
import uuid

from app.core.auth import FirebaseUser, get_current_user
from app.db.session import get_db
from app.schemas.visit import VisitCreate, VisitResponse, VisitUpdate
from app.services.user_service import get_or_create_user
from app.services.visits import (create_new_visit, delete_visit_by_id,
                                 get_users_visits, get_visit_by_id_for_user,
                                 update_visit_for_user)
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/visits", tags=["visits"])

# Header Constants
X_TOTAL_COUNT = "X-Total-Count"

@router.get(
    "",
    response_model=list[VisitResponse],
    summary="List visits for the current user.",
)
async def get_visits(
    response: Response,
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    skip: int = Query(0, ge=0, description="Number of visits to skip."),
    limit: int = Query(20, ge=1, le=100, description="Maximum visits to return."),
) -> list[VisitResponse]:
    """Get paginated visits for the current user, newest first."""
    user = await get_or_create_user(db, firebase_user)

    logger.info("Request received to list visits for user: %s", user.id)
    visits, total = await get_users_visits(user, db, skip, limit)
    response.headers[X_TOTAL_COUNT] = str(total)
    return visits

@router.get(
    "/{visit_id}",
    response_model=VisitResponse,
    summary="Get a single visit for the current user.",
)
async def get_visit(
    visit_id: uuid.UUID,
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VisitResponse:
    """Return one visit if it belongs to the current user."""
    user = await get_or_create_user(db, firebase_user)

    logger.info("Request received to get visit %s for user: %s", visit_id, user.id)
    return await get_visit_by_id_for_user(visit_id, user, db)

@router.post(
    "",
    response_model=VisitResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new visit for the current user.",
)
async def create_visit(
    visit: VisitCreate,
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> VisitResponse:
    """Create a new visit for the current user."""
    user = await get_or_create_user(db, firebase_user)

    logger.info("Request received to create visit for user: %s", user.id)
    created_visit = await create_new_visit(visit, user, db)

    return created_visit


@router.patch(
    "/{visit_id}",
    response_model=VisitResponse,
    summary="Partially update a visit for the current user.",
)
async def update_visit(
    visit_id: uuid.UUID,
    payload: VisitUpdate,
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> VisitResponse:
    """Update one or more fields on an existing visit (does not create visits)."""
    user = await get_or_create_user(db, firebase_user)

    logger.info("Request received to patch visit %s for user: %s", visit_id, user.id)
    return await update_visit_for_user(visit_id, payload, user, db)


@router.delete(
    "/{visit_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a given visit for the current user.",
) 
async def delete_visit(
    visit_id: uuid.UUID,
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
) -> None:
    """Delete a given visit for the current user."""
    user = await get_or_create_user(db, firebase_user)

    logger.info("Request received to delete visit for user: %s", user.id)
    await delete_visit_by_id(visit_id, user, db)