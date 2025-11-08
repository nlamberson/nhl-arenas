from fastapi import FastAPI

from app.core.config import get_settings
from app.routers import health

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.include_router(health.router)


@app.get("/", tags=["root"], summary="Root placeholder")
async def root() -> dict[str, str]:
  """Root endpoint placeholder."""
  return {"message": "NHL Arena Tracker backend is running"}
