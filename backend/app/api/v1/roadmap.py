from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models import InterviewSession, Scorecard, Roadmap
from app.api.v1.auth import verify_firebase_token
from app.services.roadmap_gen import generate_roadmap
from pydantic import BaseModel
from typing import List

router = APIRouter()

class RoadmapModule(BaseModel):
    title: str
    description: str
    priority: str
    resources: List[dict]

class RoadmapResponse(BaseModel):
    modules: List[RoadmapModule]

class RoadmapGenerateRequest(BaseModel):
    scorecardId: str

@router.post("/generate", response_model=RoadmapResponse)
async def generate_roadmap_endpoint(
    request: RoadmapGenerateRequest,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    
    scorecard_res = await db.execute(select(Scorecard).where(Scorecard.id == request.scorecardId))
    scorecard = scorecard_res.scalars().first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")
        
    session_res = await db.execute(select(InterviewSession).where(InterviewSession.id == scorecard.session_id))
    session = session_res.scalars().first()
    if not session or session.user_id != uid:
        raise HTTPException(status_code=403, detail="Unauthorized")
        
    # Generate roadmap
    roadmap_data = await generate_roadmap(
        {"overallScore": scorecard.overall_score, "strengths": scorecard.strong_areas, "weaknesses": scorecard.weak_areas}, 
        session.concept_graph_snapshot
    )
    
    # Save to DB
    roadmap = Roadmap(
        scorecard_id=scorecard.id,
        topics=roadmap_data
    )
    db.add(roadmap)
    await db.commit()
    
    return RoadmapResponse(modules=roadmap_data)

@router.get("/{session_id}", response_model=RoadmapResponse)
async def get_roadmap(
    session_id: str,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    
    session_res = await db.execute(select(InterviewSession).where(InterviewSession.id == session_id))
    session = session_res.scalars().first()
    
    if not session or session.user_id != uid:
        raise HTTPException(status_code=404, detail="Session not found or unauthorized")
        
    scorecard_res = await db.execute(select(Scorecard).where(Scorecard.session_id == session_id))
    scorecard = scorecard_res.scalars().first()
    if not scorecard:
        raise HTTPException(status_code=404, detail="Scorecard not found")
        
    roadmap_res = await db.execute(select(Roadmap).where(Roadmap.scorecard_id == scorecard.id))
    roadmap = roadmap_res.scalars().first()
    
    if not roadmap:
        raise HTTPException(status_code=404, detail="Roadmap not generated yet")
        
    return RoadmapResponse(modules=roadmap.topics)
