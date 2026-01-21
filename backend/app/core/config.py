from functools import lru_cache

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


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
    return self


@lru_cache()
def get_settings() -> Settings:
  """Return cached settings instance."""
  return Settings()
