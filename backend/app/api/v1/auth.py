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
import json
from datetime import datetime

router = APIRouter()
security = HTTPBearer()

# Initialize Firebase Admin SDK from environment variable (JSON string)
if not firebase_admin._apps:
    try:
        cred_json = os.getenv("FIREBASE_ADMIN_CREDENTIALS_JSON")
        if cred_json:
            cred_dict = json.loads(cred_json)
            cred = credentials.Certificate(cred_dict)
            firebase_admin.initialize_app(cred)
            print("Firebase Admin initialized successfully.")
        else:
            print("Warning: FIREBASE_ADMIN_CREDENTIALS_JSON not set. Auth will only accept mock tokens.")
    except Exception as e:
        print(f"Warning: Firebase Admin init failed: {e}")

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        # Allow mock token for local dev/testing
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

    result = await db.execute(select(User).where(User.id == uid))
    user = result.scalars().first()

    if not user:
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
