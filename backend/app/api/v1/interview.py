from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.models import InterviewSession
from app.schemas import InterviewStartRequest, InterviewStartResponse, InterviewEndRequest, InterviewEndResponse, InterviewAnswerRequest, InterviewStateResponse
from app.api.v1.auth import verify_firebase_token
import uuid
from datetime import datetime
import json
from app.db.redis import get_redis_client
from app.services.adaptive_engine import generate_next_question, evaluate_turn
from app.services.audio import transcribe_audio, generate_speech
from app.services.code_evaluator import evaluate_code
from app.services.translator import translate_to_english, translate_from_english

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
    
    # We don't return a WS url anymore, but keep the schema for compatibility or just return empty string
    return InterviewStartResponse(
        sessionId=session_record.id,
        wsUrl=""
    )

@router.get("/{sessionId}/state", response_model=InterviewStateResponse)
async def get_interview_state(
    sessionId: str,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    redis_client = await get_redis_client()
    session_record = await db.get(InterviewSession, sessionId)
    if not session_record or session_record.user_id != decoded_token.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    session_language = session_record.language if session_record else "en"
    
    graph_str = await redis_client.get(f"graph:{sessionId}")
    concept_graph = json.loads(graph_str) if graph_str else {}
    
    current_q_str = await redis_client.get(f"current_q:{sessionId}")
    current_question = json.loads(current_q_str) if current_q_str else None
    
    audio_base64 = None
    if not current_question:
        # Generate first question
        session_data = {
            "company_style": session_record.company_style,
            "interview_type": session_record.interview_type
        }
        current_question = await generate_next_question(concept_graph, session_data)
        await redis_client.set(f"current_q:{sessionId}", json.dumps(current_question))
        
        translated_q_text = await translate_from_english(current_question.get("questionText", ""), session_language)
        current_question["questionText"] = translated_q_text
        audio_base64 = await generate_speech(translated_q_text)
    
    return InterviewStateResponse(
        question=current_question,
        graph=concept_graph,
        audioBase64=audio_base64
    )

@router.post("/{sessionId}/answer", response_model=InterviewStateResponse)
async def submit_answer(
    sessionId: str,
    request: InterviewAnswerRequest,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    redis_client = await get_redis_client()
    session_record = await db.get(InterviewSession, sessionId)
    if not session_record or session_record.user_id != decoded_token.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized")
        
    session_language = session_record.language if session_record else "en"
    
    graph_str = await redis_client.get(f"graph:{sessionId}")
    concept_graph = json.loads(graph_str) if graph_str else {}
    
    current_q_str = await redis_client.get(f"current_q:{sessionId}")
    current_question = json.loads(current_q_str) if current_q_str else {}
    
    turn_count = await redis_client.get(f"turn:{sessionId}")
    turn_count = int(turn_count) if turn_count else 0
    
    answer = ""
    candidate_code = None
    language = "plaintext"
    transcript_final = None
    
    if request.type == "text_answer":
        raw_answer = request.data
        transcript_final = raw_answer
        answer = await translate_to_english(raw_answer, session_language)
    elif request.type == "audio_chunk":
        audio_base64 = request.data
        raw_answer = await transcribe_audio(audio_base64)
        transcript_final = raw_answer
        answer = await translate_to_english(raw_answer, session_language)
    elif request.type == "code_submission":
        language = request.data.get("language", "plaintext")
        candidate_code = request.data.get("code", "")
        
    # Evaluate
    from app.models import InterviewTurn
    if candidate_code is not None:
        eval_result = await evaluate_code(candidate_code, language, current_question)
    else:
        eval_result = await evaluate_turn(answer, current_question)
        
    # Update Concept Graph
    topic = current_question.get("topic", "general")
    update_action = eval_result.get("topicMasteryUpdate", "maintain")
    
    current_mastery = concept_graph.get(topic, {"score": 50})
    if update_action == "improve": current_mastery["score"] = min(100, current_mastery["score"] + 10)
    elif update_action == "degrade": current_mastery["score"] = max(0, current_mastery["score"] - 10)
    concept_graph[topic] = current_mastery
    
    await redis_client.set(f"graph:{sessionId}", json.dumps(concept_graph))
    
    # Save turn to DB
    turn = InterviewTurn(
        session_id=sessionId,
        turn_index=turn_count,
        question_text=current_question.get("questionText", ""),
        question_topic=topic,
        question_difficulty=current_question.get("difficulty", "medium"),
        adaptive_reason=current_question.get("adaptiveReason", ""),
        candidate_answer_text=answer,
        candidate_code=candidate_code,
        turn_score=eval_result.get("score", 0),
        turn_feedback=eval_result.get("feedback", "")
    )
    db.add(turn)
    session_record.concept_graph_snapshot = concept_graph
    await db.commit()
    
    turn_count += 1
    await redis_client.set(f"turn:{sessionId}", str(turn_count))
    
    # Generate next question
    session_data = {
        "company_style": session_record.company_style,
        "interview_type": session_record.interview_type
    }
    
    new_question = await generate_next_question(concept_graph, session_data)
    await redis_client.set(f"current_q:{sessionId}", json.dumps(new_question))
    
    translated_q_text = await translate_from_english(new_question.get("questionText", ""), session_language)
    new_question["questionText"] = translated_q_text
    audio_base64 = await generate_speech(translated_q_text)
    
    return InterviewStateResponse(
        question=new_question,
        graph=concept_graph,
        audioBase64=audio_base64,
        transcript_final=transcript_final
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
