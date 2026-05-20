import socket
from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_LOCAL_DB_HOSTS = frozenset({"localhost", "127.0.0.1", "db"})


def normalize_database_url(url: str) -> str:
  """Use psycopg3 driver; plain postgresql:// defaults to psycopg2 in SQLAlchemy."""
  if url.startswith("postgresql+psycopg://"):
    return url
  if url.startswith("postgresql://"):
    return "postgresql+psycopg://" + url.removeprefix("postgresql://")
  if url.startswith("postgres://"):
    return "postgresql+psycopg://" + url.removeprefix("postgres://")
  return url


def prefer_ipv4_database_url(url: str) -> str:
  """Add hostaddr so libpq uses IPv4; host is kept for SSL (Supabase, Render, etc.)."""
  parsed = urlparse(url)
  hostname = parsed.hostname
  if not hostname or hostname in _LOCAL_DB_HOSTS:
    return url
  if "hostaddr=" in (parsed.query or ""):
    return url
  try:
    port = parsed.port or 5432
    infos = socket.getaddrinfo(hostname, port, socket.AF_INET, socket.SOCK_STREAM)
    ipv4 = infos[0][4][0]
  except (socket.gaierror, OSError):
    return url
  query_params = dict(parse_qsl(parsed.query, keep_blank_values=True))
  query_params["hostaddr"] = ipv4
  if hostname.endswith(".supabase.co") and "sslmode" not in query_params:
    query_params["sslmode"] = "require"
  return urlunparse(parsed._replace(query=urlencode(query_params)))


class Settings(BaseSettings):
  """Application settings loaded from environment variables."""

  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

  app_name: str = Field(default="NHL Arena Tracker API")
  environment: str = Field(default="development")
  log_level: str = Field(default="INFO")
  
  # CORS - comma-separated origins, or "*" for all (dev only)
  cors_origins: str = Field(default="*")
  
  # Database configuration - can use DATABASE_URL or individual components
  database_url: str | None = Field(default=None)
  postgres_user: str = Field(default="postgres")
  postgres_password: str = Field(default="postgres")
  postgres_db: str = Field(default="nhl_arenas")
  postgres_host: str = Field(default="localhost")
  postgres_port: int = Field(default=5432)
  
  # Firebase configuration
  firebase_project_id: str = Field(default="")
  # Web API key (from Firebase Console → Project settings) - required for login endpoint
  firebase_api_key: str = Field(default="")
  google_application_credentials: str | None = Field(default=None)
  # Alternative: base64-encoded service account JSON (for cloud platforms that don't support file mounts)
  firebase_service_account_base64: str | None = Field(default=None)
  
  @model_validator(mode="after")
  def build_database_url(self) -> "Settings":
    """Build DATABASE_URL from components if not provided."""
    if not self.database_url:
      self.database_url = (
        f"postgresql+psycopg://{self.postgres_user}:{self.postgres_password}"
        f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
      )
    else:
      self.database_url = normalize_database_url(self.database_url)
    self.database_url = prefer_ipv4_database_url(self.database_url)
    return self


@lru_cache()
def get_settings() -> Settings:
  """Return cached settings instance."""
  return Settings()
