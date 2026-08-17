from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import AsyncSessionLocal
from app.models import InterviewSession, InterviewTurn
from app.services.adaptive_engine import generate_next_question, evaluate_turn
from app.services.audio import transcribe_audio, generate_speech
from app.services.code_evaluator import evaluate_code
from app.services.translator import translate_to_english, translate_from_english
from app.db.redis import get_redis_client
import json

router = APIRouter()

# Connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, session_id: str):
        await websocket.accept()
        self.active_connections[session_id] = websocket

    def disconnect(self, session_id: str):
        if session_id in self.active_connections:
            del self.active_connections[session_id]

    async def send_json(self, session_id: str, data: dict):
        if session_id in self.active_connections:
            await self.active_connections[session_id].send_json(data)

manager = ConnectionManager()

@router.websocket("/{session_id}")
async def interview_websocket(websocket: WebSocket, session_id: str):
    await manager.connect(websocket, session_id)
    
    # We should fetch session data and concept graph from Redis/Postgres
    redis_client = await get_redis_client()
    
    async with AsyncSessionLocal() as db:
        session_record = await db.get(InterviewSession, session_id)
        session_language = session_record.language if session_record else "en"
    
    # Load state
    graph_str = await redis_client.get(f"graph:{session_id}")
    concept_graph = json.loads(graph_str) if graph_str else {}
    
    current_q_str = await redis_client.get(f"current_q:{session_id}")
    current_question = json.loads(current_q_str) if current_q_str else None
    
    turn_count = await redis_client.get(f"turn:{session_id}")
    turn_count = int(turn_count) if turn_count else 0
    
    # If starting fresh, generate first question
    if not current_question:
        async with AsyncSessionLocal() as db:
            session_record = await db.get(InterviewSession, session_id)
            session_data = {
                "company_style": session_record.company_style if session_record else "General",
                "interview_type": session_record.interview_type if session_record else "technical"
            }
            
        current_question = await generate_next_question(concept_graph, session_data)
        await redis_client.set(f"current_q:{session_id}", json.dumps(current_question))
        
        # Translate before sending
        translated_q_text = await translate_from_english(current_question.get("questionText", ""), session_language)
        sent_question = dict(current_question)
        sent_question["questionText"] = translated_q_text
        
        await manager.send_json(session_id, {
            "type": "question_generated",
            "question": sent_question
        })
        
        # Initial voice generation if needed
        tts_base64 = await generate_speech(translated_q_text)
        if tts_base64:
            await manager.send_json(session_id, {
                "type": "audio_response",
                "audioBase64": tts_base64
            })
            
    try:
        while True:
            data = await websocket.receive_text()
            event = json.loads(data)
            
            if event.get("type") == "text_answer":
                raw_answer = event.get("data", "")
                answer = await translate_to_english(raw_answer, session_language)
                
                # Echo final transcript
                await manager.send_json(session_id, {
                    "type": "transcript_final",
                    "data": raw_answer
                })
                
                # Force process turn immediately
                event["type"] = "end_turn"
                event["answer"] = answer
                
            elif event.get("type") == "audio_chunk":
                audio_base64 = event.get("data", "")
                raw_answer = await transcribe_audio(audio_base64)
                answer = await translate_to_english(raw_answer, session_language)
                
                await manager.send_json(session_id, {
                    "type": "transcript_final",
                    "data": raw_answer
                })
                
                # Force process turn immediately after transcription
                event["type"] = "end_turn"
                event["answer"] = answer

            elif event.get("type") == "code_submission":
                code_data = event.get("data", {})
                language = code_data.get("language", "plaintext")
                code = code_data.get("code", "")
                
                event["type"] = "end_turn"
                event["candidate_code"] = code
                event["language"] = language

            if event.get("type") == "end_turn":
                answer = event.get("answer", "")
                candidate_code = event.get("candidate_code", None)
                language = event.get("language", "plaintext")
                
                # 1. Evaluate
                if candidate_code is not None:
                    eval_result = await evaluate_code(candidate_code, language, current_question)
                else:
                    eval_result = await evaluate_turn(answer, current_question)
                
                # 2. Update Concept Graph
                topic = current_question.get("topic", "general")
                update_action = eval_result.get("topicMasteryUpdate", "maintain")
                
                current_mastery = concept_graph.get(topic, {"score": 50})
                if update_action == "improve": current_mastery["score"] = min(100, current_mastery["score"] + 10)
                elif update_action == "degrade": current_mastery["score"] = max(0, current_mastery["score"] - 10)
                concept_graph[topic] = current_mastery
                
                await redis_client.set(f"graph:{session_id}", json.dumps(concept_graph))
                
                # 3. Emit graph update
                await manager.send_json(session_id, {
                    "type": "concept_graph_update",
                    "graph": concept_graph
                })
                
                # 4. Save turn to DB
                async with AsyncSessionLocal() as db:
                    turn = InterviewTurn(
                        session_id=session_id,
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
                    # Update session concept graph
                    session_record = await db.get(InterviewSession, session_id)
                    if session_record:
                        session_record.concept_graph_snapshot = concept_graph
                    await db.commit()
                    
                turn_count += 1
                await redis_client.set(f"turn:{session_id}", str(turn_count))
                
                # 5. Generate next question
                async with AsyncSessionLocal() as db:
                    session_record = await db.get(InterviewSession, session_id)
                    session_data = {
                        "company_style": session_record.company_style if session_record else "General",
                        "interview_type": session_record.interview_type if session_record else "technical"
                    }
                    
                current_question = await generate_next_question(concept_graph, session_data)
                await redis_client.set(f"current_q:{session_id}", json.dumps(current_question))
                
                # 6. Emit new question & Voice
                translated_q_text = await translate_from_english(current_question.get("questionText", ""), session_language)
                sent_question = dict(current_question)
                sent_question["questionText"] = translated_q_text
                
                await manager.send_json(session_id, {
                    "type": "question_generated",
                    "question": sent_question
                })
                
                tts_base64 = await generate_speech(translated_q_text)
                if tts_base64:
                    await manager.send_json(session_id, {
                        "type": "audio_response",
                        "audioBase64": tts_base64
                    })
                
    except WebSocketDisconnect:
        manager.disconnect(session_id)
