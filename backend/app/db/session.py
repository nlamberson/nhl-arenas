from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import get_settings

settings = get_settings()

# Convert postgresql:// to postgresql+asyncpg:// for async support
# If using psycopg, use postgresql+psycopg://
database_url = settings.database_url.replace(
    "postgresql+psycopg://", "postgresql+psycopg://"
).replace(
    "postgresql://", "postgresql+psycopg://"
)

engine = create_async_engine(database_url, echo=False, future=True)
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
  """Yield an async database session."""
  async with AsyncSessionLocal() as session:
    try:
      yield session
    finally:
      await session.close()
