from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
  """Application settings loaded from environment variables."""

  model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

  app_name: str = Field(default="NHL Arena Tracker API")
  environment: str = Field(default="development")
  database_url: str = Field(default="postgresql+psycopg://postgres:postgres@localhost:5432/nhl_arenas")


@lru_cache()
def get_settings() -> Settings:
  """Return cached settings instance."""
  return Settings()
