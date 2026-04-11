"""FastAPI exception handlers for API and infrastructure errors."""

import logging

from fastapi import Request, status
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from app.core.exceptions import APIException

logger = logging.getLogger(__name__)


async def api_exception_handler(_request: Request, exc: APIException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers,
    )


async def request_validation_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    return await request_validation_exception_handler(request, exc)


async def integrity_error_handler(_request: Request, _exc: IntegrityError) -> JSONResponse:
    logger.exception("Database integrity constraint violated")
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={"detail": "Could not save data due to a resource conflict"},
    )
