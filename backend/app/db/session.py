from collections.abc import AsyncGenerator

from app.core.config import get_settings
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

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

async def save(entity, db: AsyncSession):
  """Helper function to resemble a Spring Boot save. 
    Adds an entity. Then commits and obtains latest entity values from the DB 
    (like a udpated timestamp), and returns the updated entity to be used in a service.
    """
  db.add(entity)
  await db.commit()
  await db.refresh(entity)
  return entity


async def delete(entity, db: AsyncSession) -> None:
  """Helper function to resemble a Spring Boot delete. 
    Delete entity and commit it to the DB.
    """
  await db.delete(entity)
  await db.commit()
