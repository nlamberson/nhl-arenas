from fastapi import APIRouter

router = APIRouter(prefix="/health", tags=["health"])


@router.get("/", summary="Health check")
async def health_check() -> dict[str, str]:
  """Returns the health status of the API."""
  return {"status": "ok"}
