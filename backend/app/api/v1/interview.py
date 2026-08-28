from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.db.session import get_db
from app.models import InterviewSession, InterviewTurn, Scorecard
from app.schemas import (
    InterviewStartRequest, InterviewStartResponse,
    InterviewEndRequest, InterviewEndResponse,
    InterviewAnswerRequest, InterviewStateResponse,
    ScorecardResponse, SpiderChartData, FeedbackItem
)
from app.api.v1.auth import verify_firebase_token
from app.services.adaptive_engine import generate_next_question, evaluate_turn
from app.services.rubric_scorer import generate_scorecard
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

    return InterviewStartResponse(sessionId=session_record.id, wsUrl="")


@router.get("/{sessionId}/state", response_model=InterviewStateResponse)
async def get_interview_state(
    sessionId: str,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    session_record = await db.get(InterviewSession, sessionId)
    if not session_record or session_record.user_id != decoded_token.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized")

    concept_graph = session_record.concept_graph_snapshot or {}

    # Check if there's already an unanswered turn (last turn with no answer)
    result = await db.execute(
        select(InterviewTurn)
        .where(InterviewTurn.session_id == sessionId)
        .order_by(InterviewTurn.turn_index.desc())
    )
    last_turn = result.scalars().first()

    if last_turn and last_turn.candidate_answer_text is None:
        current_question = {
            "questionText": last_turn.question_text,
            "topic": last_turn.question_topic,
            "difficulty": last_turn.question_difficulty,
            "adaptiveReason": last_turn.adaptive_reason,
        }
    else:
        # Generate first/next question
        session_data = {
            "company_style": session_record.company_style,
            "interview_type": session_record.interview_type
        }
        current_question = await generate_next_question(concept_graph, session_data)

        # Save question as a pending turn
        turn_count = last_turn.turn_index + 1 if last_turn else 0
        new_turn = InterviewTurn(
            session_id=sessionId,
            turn_index=turn_count,
            question_text=current_question.get("questionText", ""),
            question_topic=current_question.get("topic", "general"),
            question_difficulty=current_question.get("difficulty", "medium"),
            adaptive_reason=current_question.get("adaptiveReason", ""),
        )
        db.add(new_turn)
        await db.commit()

    return InterviewStateResponse(question=current_question, graph=concept_graph)


@router.post("/{sessionId}/answer", response_model=InterviewStateResponse)
async def submit_answer(
    sessionId: str,
    request: InterviewAnswerRequest,
    decoded_token: dict = Depends(verify_firebase_token),
    db: AsyncSession = Depends(get_db)
):
    session_record = await db.get(InterviewSession, sessionId)
    if not session_record or session_record.user_id != decoded_token.get("uid"):
        raise HTTPException(status_code=403, detail="Not authorized")

    concept_graph = session_record.concept_graph_snapshot or {}

    # Find the last unanswered turn
    result = await db.execute(
        select(InterviewTurn)
        .where(InterviewTurn.session_id == sessionId)
        .order_by(InterviewTurn.turn_index.desc())
    )
    current_turn = result.scalars().first()

    if not current_turn:
        raise HTTPException(status_code=404, detail="No active question found")

    # Get answer text
    answer_text = ""
    if request.type == "text_answer":
        answer_text = request.data
    elif request.type == "code_submission":
        answer_text = f"[Code]\n{request.data.get('code', '')}"

    # Evaluate answer
    current_question = {
        "questionText": current_turn.question_text,
        "topic": current_turn.question_topic,
        "difficulty": current_turn.question_difficulty,
    }
    eval_result = await evaluate_turn(answer_text, current_question)

    # Update concept graph
    topic = current_turn.question_topic
    update_action = eval_result.get("topicMasteryUpdate", "maintain")
    current_mastery = concept_graph.get(topic, {"score": 50})
    if update_action == "improve":
        current_mastery["score"] = min(100, current_mastery["score"] + 10)
    elif update_action == "degrade":
        current_mastery["score"] = max(0, current_mastery["score"] - 10)
    concept_graph[topic] = current_mastery

    # Persist answer + evaluation to the turn
    current_turn.candidate_answer_text = answer_text
    current_turn.turn_score = eval_result.get("score", 0)
    current_turn.turn_feedback = eval_result.get("feedback", "")
    session_record.concept_graph_snapshot = concept_graph
    await db.commit()

    # Generate next question
    session_data = {
        "company_style": session_record.company_style,
        "interview_type": session_record.interview_type
    }
    new_question = await generate_next_question(concept_graph, session_data)

    # Save next question as pending turn
    next_turn = InterviewTurn(
        session_id=sessionId,
        turn_index=current_turn.turn_index + 1,
        question_text=new_question.get("questionText", ""),
        question_topic=new_question.get("topic", "general"),
        question_difficulty=new_question.get("difficulty", "medium"),
        adaptive_reason=new_question.get("adaptiveReason", ""),
    )
    db.add(next_turn)
    await db.commit()

    return InterviewStateResponse(question=new_question, graph=concept_graph)


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
        raise HTTPException(status_code=404, detail="Session not found")
    if session_record.user_id != uid:
        raise HTTPException(status_code=403, detail="Not authorized")

    session_record.status = "completed"
    session_record.ended_at = datetime.utcnow()
    await db.commit()

    # Generate scorecard from all answered turns
    result = await db.execute(
        select(InterviewTurn)
        .where(InterviewTurn.session_id == sessionId)
        .where(InterviewTurn.candidate_answer_text != None)
        .order_by(InterviewTurn.turn_index)
    )
    turns = result.scalars().all()
    scorecard_data = await generate_scorecard(turns)

    scorecard = Scorecard(
        session_id=sessionId,
        overall_score=scorecard_data.get("overallScore", 0),
        technical_score=scorecard_data.get("spiderChart", {}).get("technicalAccuracy", 0),
        communication_score=scorecard_data.get("spiderChart", {}).get("communication", 0),
        topic_breakdown=[
            {"topic": k, "score": v, "verdict": "strong" if v > 70 else "weak"}
            for k, v in scorecard_data.get("spiderChart", {}).items()
        ],
        strong_areas=scorecard_data.get("strengths", []),
        weak_areas=scorecard_data.get("weaknesses", []),
        detailed_feedback=[]
    )
    db.add(scorecard)
    await db.commit()
    await db.refresh(scorecard)

    return InterviewEndResponse(status="completed", scorecardId=scorecard.id)
