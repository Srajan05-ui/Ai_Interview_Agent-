from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models import InterviewSession
from app.schemas import InterviewStartRequest, InterviewStartResponse, InterviewEndRequest, InterviewEndResponse
from app.api.v1.auth import verify_firebase_token
import uuid
from datetime import datetime

router = APIRouter()

@router.post("/start", response_model=InterviewStartResponse)
async def start_interview(
    request: InterviewStartRequest,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    if not uid:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    session_record = InterviewSession(
        user_id=uid,
        resume_id=request.resumeId,
        interview_type=request.interviewType,
        company_style=request.companyStyle,
        language=request.language,
        status="in_progress",
        concept_graph_snapshot={},
        started_at=datetime.utcnow()
    )
    
    db.add(session_record)
    await db.commit()
    await db.refresh(session_record)
    
    # In a real app, you might use a specific domain
    ws_url = f"ws://localhost:8000/ws/interview/{session_record.id}"
    
    return InterviewStartResponse(
        sessionId=session_record.id,
        wsUrl=ws_url
    )

@router.post("/{sessionId}/end", response_model=InterviewEndResponse)
async def end_interview(
    sessionId: str,
    request: InterviewEndRequest,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    
    session_record = await db.get(InterviewSession, sessionId)
    if not session_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    if session_record.user_id != uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    session_record.status = "completed"
    session_record.ended_at = datetime.utcnow()
    
    await db.commit()
    
    # Generate a scorecard here and return the ID.
    from app.services.rubric_scorer import generate_scorecard
    from app.models import InterviewTurn, Scorecard
    from sqlalchemy import select
    import uuid
    
    result = await db.execute(select(InterviewTurn).where(InterviewTurn.session_id == sessionId).order_by(InterviewTurn.turn_index))
    turns = result.scalars().all()
    
    scorecard_data = await generate_scorecard(turns)
    
    scorecard = Scorecard(
        session_id=sessionId,
        overall_score=scorecard_data.get("overallScore", 0),
        technical_score=scorecard_data.get("spiderChart", {}).get("technicalAccuracy", 0),
        communication_score=scorecard_data.get("spiderChart", {}).get("communication", 0),
        topic_breakdown=[{"topic": k, "score": v, "verdict": "strong" if v > 70 else "weak"} for k, v in scorecard_data.get("spiderChart", {}).items()],
        strong_areas=scorecard_data.get("strengths", []),
        weak_areas=scorecard_data.get("weaknesses", []),
        detailed_feedback=[]
    )
    db.add(scorecard)
    await db.commit()
    await db.refresh(scorecard)
    
    return InterviewEndResponse(
        status="completed",
        scorecardId=scorecard.id
    )

from app.schemas import ScorecardResponse, SpiderChartData, FeedbackItem
from app.models import InterviewTurn
from sqlalchemy import select

@router.get("/{sessionId}/scorecard", response_model=ScorecardResponse)
async def get_scorecard(
    sessionId: str,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    uid = decoded_token.get("uid")
    
    session_record = await db.get(InterviewSession, sessionId)
    if not session_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
        
    if session_record.user_id != uid:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
        
    result = await db.execute(select(InterviewTurn).where(InterviewTurn.session_id == sessionId))
    turns = result.scalars().all()
    
    if not turns:
        # Default empty if no turns
        return ScorecardResponse(
            overallScore=0,
            spiderChart=SpiderChartData(problemSolving=0, communication=0, technicalAccuracy=0, codeQuality=0, systemDesign=0),
            strengths=[],
            weaknesses=[]
        )
        
    # Mock aggregation logic based on turns
    avg_score = sum(t.turn_score or 0 for t in turns) // len(turns)
    
    # Using concept_graph_snapshot for spider chart if available, otherwise fallback dummy data
    graph = session_record.concept_graph_snapshot or {}
    
    return ScorecardResponse(
        overallScore=avg_score,
        spiderChart=SpiderChartData(
            problemSolving=graph.get("problem_solving", {}).get("score", 75),
            communication=graph.get("communication", {}).get("score", 80),
            technicalAccuracy=graph.get("technical_accuracy", {}).get("score", 70),
            codeQuality=graph.get("code_quality", {}).get("score", 85),
            systemDesign=graph.get("system_design", {}).get("score", 65)
        ),
        strengths=[FeedbackItem(category="General", feedback="Strong fundamental knowledge based on answers.")],
        weaknesses=[FeedbackItem(category="Depth", feedback="Consider providing more concrete examples in your explanations.")]
    )
