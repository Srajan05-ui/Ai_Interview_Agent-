import json
from app.services.llm_router import generate

EVAL_CODE_PROMPT = """
You are an expert technical interviewer.
Evaluate the candidate's code submission for the following question.

Question: {question_text}
Topic: {topic}
Difficulty: {difficulty}

Candidate Code (Language: {language}):
```{language}
{code}
```

Evaluate the code for correctness (does it solve the problem?), time complexity, and space complexity.
Provide an evaluation in STRICT JSON matching this schema:
{{
    "score": integer (0-100),
    "feedback": "string (constructive feedback mentioning correctness and complexities)",
    "topicMasteryUpdate": "string (one of: 'improve', 'maintain', 'degrade')"
}}
Return ONLY valid JSON.
"""

async def evaluate_code(code: str, language: str, question_data: dict) -> dict:
    prompt = EVAL_CODE_PROMPT.format(
        question_text=question_data.get("questionText", ""),
        topic=question_data.get("topic", "general"),
        difficulty=question_data.get("difficulty", "medium"),
        language=language,
        code=code
    )
    
    result = await generate(prompt)
    content = result.content.strip()
    if content.startswith("```json"): content = content[7:]
    if content.startswith("```"): content = content[3:]
    if content.endswith("```"): content = content[:-3]
    
    try:
        return json.loads(content.strip())
    except Exception as e:
        print(f"Code eval parse error: {e}")
        return {"score": 50, "feedback": "Could not parse code evaluation.", "topicMasteryUpdate": "maintain"}
