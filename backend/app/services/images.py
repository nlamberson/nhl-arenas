"""Visit image metadata services (Firebase Storage holds the bytes)."""

from __future__ import annotations

import logging
import re
import uuid

from app.core.exceptions import (
    APIException,
    ConflictError,
    ResourceNotFoundError,
    ValidationError,
    VisitNotFoundError,
)
from app.core.firebase import delete_storage_object
from app.db.session import delete, save
from app.models import Image, User, Visit
from app.models.image import MAX_IMAGES_PER_VISIT
from app.schemas.image import ImageCreate, ImageResponse
from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger(__name__)

_EXT_BY_MIME = {
    "image/jpeg": frozenset({"jpg", "jpeg"}),
    "image/jpg": frozenset({"jpg", "jpeg"}),
    "image/png": frozenset({"png"}),
    "image/webp": frozenset({"webp"}),
}
_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024


class StorageDeleteError(APIException):
    """Raised when Firebase Storage delete fails before metadata cleanup."""

    def __init__(self, detail: str = "Failed to delete image from storage") -> None:
        super().__init__(status.HTTP_502_BAD_GATEWAY, detail)


def expected_storage_path_prefix(firebase_uid: str, visit_id: uuid.UUID) -> str:
    return f"visits/{firebase_uid}/{visit_id}/"


def validate_storage_path(
    storage_path: str,
    *,
    firebase_uid: str,
    visit_id: uuid.UUID,
    slot_index: int,
    mime_type: str,
) -> None:
    """Ensure path matches visits/{uid}/{visitId}/{slot}.{ext} and matches mime."""
    prefix = expected_storage_path_prefix(firebase_uid, visit_id)
    if not storage_path.startswith(prefix):
        raise ValidationError(f"storage_path must start with {prefix}")

    filename = storage_path[len(prefix) :]
    match = re.fullmatch(
        r"([0-4])\.(jpg|jpeg|png|webp)",
        filename,
        flags=re.IGNORECASE,
    )
    if match is None:
        raise ValidationError(
            "storage_path filename must be {0-4}.{jpg|jpeg|png|webp}",
        )

    path_slot = int(match.group(1))
    if path_slot != slot_index:
        raise ValidationError("slot_index must match the filename in storage_path")

    ext = match.group(2).lower()
    mime = mime_type.lower().strip()
    if not mime.startswith("image/"):
        raise ValidationError("mime_type must be an image/* content type")

    allowed_exts = _EXT_BY_MIME.get(mime)
    if allowed_exts is None or ext not in allowed_exts:
        raise ValidationError(
            f"mime_type {mime_type!r} is not allowed for extension .{ext}",
        )


async def create_visit_image(
    visit_id: uuid.UUID,
    payload: ImageCreate,
    user: User,
    db: AsyncSession,
) -> ImageResponse:
    """Record metadata after the client uploaded to Firebase Storage."""

    visit = await _get_owned_visit(visit_id, user, db)

    mime = payload.mime_type.lower().strip()
    if not mime.startswith("image/"):
        raise ValidationError("mime_type must start with image/")

    if payload.file_size > _MAX_FILE_SIZE_BYTES:
        raise ValidationError("file_size must be at most 10MB")

    validate_storage_path(
        payload.storage_path,
        firebase_uid=user.firebase_uid,
        visit_id=visit.id,
        slot_index=payload.slot_index,
        mime_type=mime,
    )

    count = await _count_images_for_visit(visit.id, db)
    if count >= MAX_IMAGES_PER_VISIT:
        raise ConflictError(
            f"Visit already has the maximum of {MAX_IMAGES_PER_VISIT} images"
        )

    existing_slot = await db.execute(
        select(Image.id).where(
            Image.visit_id == visit.id,
            Image.slot_index == payload.slot_index,
        )
    )
    if existing_slot.scalar_one_or_none() is not None:
        raise ConflictError(
            f"slot_index {payload.slot_index} is already taken for this visit"
        )

    image = Image(
        visit_id=visit.id,
        user_id=user.id,
        storage_path=payload.storage_path,
        slot_index=payload.slot_index,
        mime_type=mime,
        file_size=payload.file_size,
    )
    saved = await save(image, db)
    return ImageResponse.model_validate(saved)


async def delete_visit_image_by_id(
    visit_id: uuid.UUID,
    image_id: uuid.UUID,
    user: User,
    db: AsyncSession,
) -> None:
    """Delete Storage object first, then metadata. Fails if Storage delete fails."""

    await _get_owned_visit(visit_id, user, db)

    stmt = select(Image).where(
        Image.id == image_id,
        Image.visit_id == visit_id,
        Image.user_id == user.id,
    )
    result = await db.execute(stmt)
    image = result.scalar_one_or_none()
    if image is None:
        raise ResourceNotFoundError("Image not found")

    try:
        delete_storage_object(image.storage_path)
    except Exception as e:
        logger.error(
            "Firebase Storage delete failed for %s: %s",
            image.storage_path,
            e,
        )
        raise StorageDeleteError(
            f"Failed to delete image from storage: {e}"
        ) from e

    await delete(image, db)


async def delete_storage_objects_for_visit(visit: Visit) -> None:
    """Delete all Storage objects for a visit. Raises if any delete fails."""
    for image in list(visit.images or []):
        try:
            delete_storage_object(image.storage_path)
        except Exception as e:
            logger.error(
                "Firebase Storage delete failed for %s during visit delete: %s",
                image.storage_path,
                e,
            )
            raise StorageDeleteError(
                f"Failed to delete visit image from storage: {e}"
            ) from e


async def _get_owned_visit(
    visit_id: uuid.UUID, user: User, db: AsyncSession
) -> Visit:
    stmt = select(Visit).where(Visit.id == visit_id, Visit.user_id == user.id)
    result = await db.execute(stmt)
    visit = result.scalar_one_or_none()
    if visit is None:
        raise VisitNotFoundError()
    return visit


async def _count_images_for_visit(visit_id: uuid.UUID, db: AsyncSession) -> int:
    stmt = select(func.count()).select_from(Image).where(Image.visit_id == visit_id)
    result = await db.execute(stmt)
    return int(result.scalar_one() or 0)
