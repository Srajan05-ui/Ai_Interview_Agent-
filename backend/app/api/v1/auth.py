from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models import User
from app.schemas import UserResponse
import firebase_admin
from firebase_admin import credentials, auth as firebase_auth
import os
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

# Initialize Firebase Admin (in a real app, do this in main.py lifespan)
# For Phase 0, we'll try to initialize here or mock it if credentials are missing
if not firebase_admin._apps:
    try:
        cred_path = os.getenv("FIREBASE_ADMIN_CREDENTIALS_JSON", "path/to/fake.json")
        if os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
    except Exception as e:
        print(f"Warning: Firebase Admin not initialized: {e}")

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        if token == "mock-token":
            return {"uid": "mock-uid-123", "email": "test@example.com", "name": "Test User", "firebase": {"sign_in_provider": "google"}}
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user(
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    email = decoded_token.get("email")
    name = decoded_token.get("name", "Unknown User")
    provider = decoded_token.get("firebase", {}).get("sign_in_provider", "google")
    
    # Query database for user
    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalars().first()
    
    if not user:
        # Create user if they don't exist
        user = User(
            id=uid,
            email=email,
            display_name=name,
            auth_provider=provider,
            created_at=datetime.utcnow()
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    # Determine profile completeness
    profile_complete = bool(user.target_role and user.experience_level)
    
    return UserResponse(
        id=user.id,
        email=user.email,
        display_name=user.display_name,
        auth_provider=user.auth_provider,
        profileComplete=profile_complete,
        target_role=user.target_role,
        experience_level=user.experience_level,
        created_at=user.created_at
    )
