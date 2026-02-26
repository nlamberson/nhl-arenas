"""Router for /visits endpoints."""

import logging
import uuid

from app.core.auth import FirebaseUser, get_current_user
from app.db.session import get_db
from app.schemas.visit import VisitCreate, VisitResponse, VisitUpdate
from app.services.user_service import get_or_create_user
from app.services.visits import create_new_visit, delete_visit_by_id
from fastapi import APIRouter, Depends, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/visits", tags=["visits"])

@router.get(
    "",
)
async def get_visits() -> list[VisitResponse]:
    """Get all visits for the current user."""
    return JSONResponse(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        content={"detail": "This functionality is not yet available, please check back later."}
    )

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