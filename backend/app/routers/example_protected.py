"""Example protected endpoint showing real-world usage patterns."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import FirebaseUser, get_current_user
from app.db.session import get_db
from app.services.user_service import get_or_create_user

router = APIRouter(prefix="/api/v1", tags=["examples"])


@router.get("/profile")
async def get_user_profile(
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get the current user's profile.
    
    This demonstrates how to:
    1. Require authentication
    2. Access the database
    3. Sync Firebase user with local database
    """
    # This will create the user in DB if they don't exist,
    # or update their info if it changed in Firebase
    user = await get_or_create_user(db, firebase_user)
    
    return {
        "uid": user.firebase_uid,
        "email": user.email,
        "display_name": user.display_name,
        "photo_url": user.photo_url,
        "created_at": user.created_at.isoformat(),
        "email_verified": firebase_user.email_verified,
    }


# Example: Arena visits endpoint (you'll implement this for real later)
@router.get("/my-arena-visits")
async def get_my_arena_visits(
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get all arena visits for the current user.
    
    This is just an example structure - you'll implement the real version
    once you have your Arena and Visit models set up.
    """
    user = await get_or_create_user(db, firebase_user)
    
    # TODO: Query visits from database
    # Example query (once you have Visit model):
    # stmt = select(Visit).where(Visit.user_id == user.firebase_uid)
    # result = await db.execute(stmt)
    # visits = result.scalars().all()
    
    return {
        "user_id": user.firebase_uid,
        "visits": [],  # Will be populated once you create Visit model
        "total_arenas_visited": 0,
    }


@router.post("/arena-visits")
async def create_arena_visit(
    arena_id: int,
    firebase_user: FirebaseUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new arena visit for the current user.
    
    Example showing how to create related data for authenticated users.
    """
    user = await get_or_create_user(db, firebase_user)
    
    # TODO: Validate arena exists
    # TODO: Create visit record
    # Example:
    # new_visit = Visit(
    #     user_id=user.firebase_uid,
    #     arena_id=arena_id,
    #     visit_date=datetime.now()
    # )
    # db.add(new_visit)
    # await db.commit()
    
    return {
        "message": f"Visit created for user {user.firebase_uid}",
        "arena_id": arena_id,
    }


# Example of endpoint that doesn't require auth
@router.get("/public/arenas")
async def get_all_arenas():
    """
    Get all arenas - public endpoint, no authentication required.
    
    This shows that you can have both protected and public endpoints.
    """
    return {
        "arenas": [
            {"id": 1, "name": "TD Garden", "city": "Boston"},
            {"id": 2, "name": "Madison Square Garden", "city": "New York"},
            # etc...
        ]
    }

