import json
import re
from app.services.llm_router import generate

EVAL_PROMPT = """
You are an expert technical interviewer.
Evaluate the candidate's answer to the following question.

Question: {question_text}
Topic: {topic}
Difficulty: {difficulty}

Candidate Answer: {answer_text}

Provide an evaluation in STRICT JSON matching this schema:
{{
    "score": integer (0-100),
    "feedback": "string (constructive feedback)",
    "topicMasteryUpdate": "string (one of: 'improve', 'maintain', 'degrade')"
}}
Return ONLY valid JSON.
"""

GENERATE_PROMPT = """
You are an expert technical interviewer.
Based on the candidate's concept graph, generate the NEXT question.

Concept Graph:
{concept_graph}

Company Style: {company_style}
Interview Type: {interview_type}

Provide the next question in STRICT JSON matching this schema:
{{
    "questionText": "string",
    "topic": "string",
    "difficulty": "string (easy/medium/hard)",
    "adaptiveReason": "string (Why this question was chosen based on the graph)"
}}
Return ONLY valid JSON.
"""

def extract_json(content: str) -> str:
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        return match.group(0)
    return content

async def evaluate_turn(answer_text: str, question_data: dict) -> dict:
    prompt = EVAL_PROMPT.format(
        question_text=question_data.get("questionText", ""),
        topic=question_data.get("topic", "general"),
        difficulty=question_data.get("difficulty", "medium"),
        answer_text=answer_text
    )
    
    result = await generate(prompt)
    content = extract_json(result.content)
    
    try:
        return json.loads(content)
    except Exception as e:
        print(f"Eval parse error: {e}")
        return {"score": 50, "feedback": "Could not parse evaluation.", "topicMasteryUpdate": "maintain"}

async def generate_next_question(concept_graph: dict, session_data: dict) -> dict:
    prompt = GENERATE_PROMPT.format(
        concept_graph=json.dumps(concept_graph),
        company_style=session_data.get("company_style", "General Software Engineering"),
        interview_type=session_data.get("interview_type", "technical")
    )
    
    result = await generate(prompt)
    content = extract_json(result.content)
    
    try:
        return json.loads(content)
    except Exception as e:
        print(f"Question generation parse error: {e}")
        return {
            "questionText": "Could you tell me about a time you solved a difficult technical problem?",
            "topic": "behavioral",
            "difficulty": "medium",
            "adaptiveReason": "Fallback question due to parsing error."
        }
