import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.firebase import initialize_firebase
from app.routers import auth, health, reference

settings = get_settings()

# Configure logging based on environment
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
  """Initialize services on startup."""
  logger.info(f"Starting {settings.app_name} in {settings.environment} mode")
  # Initialize Firebase Admin SDK
  initialize_firebase()
  yield
  logger.info("Shutting down...")


app = FastAPI(title=settings.app_name, lifespan=lifespan)

# Configure CORS - parse comma-separated origins or use "*" for development
cors_origins = (
    ["*"] if settings.cors_origins == "*" 
    else [origin.strip() for origin in settings.cors_origins.split(",")]
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=cors_origins,
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(reference.router)


@app.get("/", tags=["root"], summary="Root placeholder")
async def root() -> dict[str, str]:
  """Root endpoint placeholder."""
  return {"message": "NHL Arena Tracker backend is running"}
