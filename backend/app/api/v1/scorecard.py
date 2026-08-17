from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models import InterviewSession, Scorecard
from app.api.v1.auth import verify_firebase_token
from app.schemas import ScorecardResponse

router = APIRouter()

@router.get("/{session_id}", response_model=ScorecardResponse)
async def get_scorecard(
    session_id: str,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    
    # Fetch session
    session_res = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = session_res.scalars().first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != uid:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")
        
    # Fetch scorecard from DB
    scorecard_res = await db.execute(select(Scorecard).where(Scorecard.session_id == session_id))
    scorecard = scorecard_res.scalars().first()
    
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not generated yet")
        
    # Reconstruct the expected response
    spider_chart = {item["topic"]: item["score"] for item in scorecard.topic_breakdown} if scorecard.topic_breakdown else {}
    
    scorecard_data = {
        "overallScore": scorecard.overall_score,
        "spiderChart": {
            "problemSolving": spider_chart.get("problemSolving", 0),
            "communication": spider_chart.get("communication", 0),
            "technicalAccuracy": spider_chart.get("technicalAccuracy", 0),
            "codeQuality": spider_chart.get("codeQuality", 0),
            "systemDesign": spider_chart.get("systemDesign", 0)
        },
        "strengths": scorecard.strong_areas,
        "weaknesses": scorecard.weak_areas
    }
    
    return ScorecardResponse(**scorecard_data)
