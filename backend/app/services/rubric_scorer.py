import json
from app.services.llm_router import generate

SCORER_PROMPT = """
You are an expert technical interviewer evaluating a completed interview.
Analyze the following interview transcript and provide a comprehensive scorecard.

Transcript:
{transcript}

Return the scorecard strictly as a JSON object matching this schema:
{{
    "overallScore": integer (0-100),
    "spiderChart": {{
        "problemSolving": integer (0-100),
        "communication": integer (0-100),
        "technicalAccuracy": integer (0-100),
        "codeQuality": integer (0-100),
        "systemDesign": integer (0-100)
    }},
    "strengths": [
        {{"category": "string", "feedback": "string"}}
    ],
    "weaknesses": [
        {{"category": "string", "feedback": "string"}}
    ]
}}
Do NOT include any markdown formatting.
"""

async def generate_scorecard(turns) -> dict:
    if not turns:
        return {
            "overallScore": 0,
            "spiderChart": {"problemSolving": 0, "communication": 0, "technicalAccuracy": 0, "codeQuality": 0, "systemDesign": 0},
            "strengths": [],
            "weaknesses": [{"category": "General", "feedback": "No interview data found."}]
        }
        
    transcript = ""
    for t in turns:
        transcript += f"Q: {t.question_text}\nA: {t.candidate_answer_text}\nScore: {t.turn_score}\nFeedback: {t.turn_feedback}\n\n"
        
    prompt = SCORER_PROMPT.format(transcript=transcript)
    result = await generate(prompt)
    
    content = result.content.strip()
    if content.startswith("```json"): content = content[7:]
    if content.startswith("```"): content = content[3:]
    if content.endswith("```"): content = content[:-3]
    
    try:
        return json.loads(content.strip())
    except Exception as e:
        print(f"Failed to parse Scorecard: {e}")
        return {
            "overallScore": 50,
            "spiderChart": {"problemSolving": 50, "communication": 50, "technicalAccuracy": 50, "codeQuality": 50, "systemDesign": 50},
            "strengths": [{"category": "Effort", "feedback": "Attempted the interview."}],
            "weaknesses": [{"category": "System", "feedback": "Failed to parse AI evaluation."}]
        }
