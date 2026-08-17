from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.db.session import get_db
from app.models import InterviewSession
from app.api.v1.auth import verify_firebase_token
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

router = APIRouter()

class HistoryItem(BaseModel):
    sessionId: str
    date: datetime
    interviewType: str
    companyStyle: Optional[str]
    status: str
    durationMinutes: Optional[int]

    class Config:
        populate_by_name = True

@router.get("/", response_model=List[HistoryItem])
async def get_history(
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    result = await db.execute(
        select(InterviewSession)
        .where(InterviewSession.user_id == uid)
        .order_by(desc(InterviewSession.started_at))
    )
    sessions = result.scalars().all()
    
    history = []
    for s in sessions:
        duration = None
        if s.ended_at and s.started_at:
            duration = int((s.ended_at - s.started_at).total_seconds() / 60)
            
        history.append(HistoryItem(
            sessionId=s.id,
            date=s.started_at,
            interviewType=s.interview_type,
            companyStyle=s.company_style,
            status=s.status,
            durationMinutes=duration
        ))
        
    return history
