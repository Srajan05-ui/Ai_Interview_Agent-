import json
import re
from typing import Optional
from app.services.llm_router import generate

ATS_PROMPT_TEMPLATE = """
You are an expert AI Technical Recruiter and Applicant Tracking System (ATS).
Please analyze the following resume text. If a job description is provided, score the resume against it. If not, score it based on general software engineering best practices.

Job Description:
{job_description}

Resume Text:
{resume_text}

Extract the following information and return it STRICTLY as a JSON object matching this schema:
{{
  "atsScore": integer (0-100 overall score),
  "atsSubscores": {{
    "formatting": integer (0-100),
    "keywordMatch": integer (0-100),
    "structure": integer (0-100),
    "impactQuantification": integer (0-100)
  }},
  "suggestions": [
    {{
      "section": "string (e.g., Experience, Education)",
      "issue": "string (brief issue description)",
      "suggestion": "string (actionable improvement)"
    }}
  ],
  "parsedSkills": ["string", "string"]
}}

Return ONLY valid JSON. Do not include markdown formatting like ```json or any other text.
"""

def extract_json(content: str) -> str:
    match = re.search(r'\{.*\}', content, re.DOTALL)
    if match:
        return match.group(0)
    return content

async def analyze_resume(text: str, job_description: Optional[str] = None) -> dict:
    prompt = ATS_PROMPT_TEMPLATE.format(
        job_description=job_description or "None provided. Use general software engineering criteria.",
        resume_text=text
    )
    
    # We pass None for schema to LLM router since our $0 router might not support strict JSON mode 
    # natively across all 3 providers (OpenRouter free models especially). We just prompt for JSON.
    result = await generate(prompt)
    
    # Clean up potential markdown formatting from LLM
    content = extract_json(result.content)
    
    try:
        parsed_json = json.loads(content)
        return parsed_json
    except json.JSONDecodeError as e:
        print(f"Failed to parse LLM ATS output: {e}\nRaw output: {content}")
        # Fallback empty structure so the app doesn't crash entirely if LLM formats badly
        return {
            "atsScore": 50,
            "atsSubscores": {"formatting": 50, "keywordMatch": 50, "structure": 50, "impactQuantification": 50},
            "suggestions": [{"section": "System", "issue": "Parsing Error", "suggestion": "The AI failed to format the response correctly. Try again."}],
            "parsedSkills": []
        }
