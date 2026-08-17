import json
from app.services.llm_router import generate

ROADMAP_PROMPT = """
You are an expert technical mentor. Based on a candidate's recent interview scorecard and concept graph, generate a personalized learning roadmap.

Scorecard Weaknesses:
{weaknesses}

Concept Graph:
{concept_graph}

Return the roadmap strictly as a JSON array of modules matching this schema:
[
    {{
        "title": "string (e.g., Advanced Graph Algorithms)",
        "description": "string",
        "priority": "string (High, Medium, Low)",
        "resources": ["string (e.g., LeetCode 207, System Design Primer)"]
    }}
]
Do NOT include any markdown formatting.
"""

async def generate_roadmap(scorecard: dict, concept_graph: dict) -> list:
    weaknesses = json.dumps(scorecard.get("weaknesses", []))
    graph = json.dumps(concept_graph or {})
    
    prompt = ROADMAP_PROMPT.format(weaknesses=weaknesses, concept_graph=graph)
    result = await generate(prompt)
    
    content = result.content.strip()
    if content.startswith("```json"): content = content[7:]
    if content.startswith("```"): content = content[3:]
    if content.endswith("```"): content = content[:-3]
    
    try:
        return json.loads(content.strip())
    except Exception as e:
        print(f"Failed to parse Roadmap: {e}")
        return [
            {
                "title": "General System Design",
                "description": "Review basic system design principles.",
                "priority": "High",
                "resources": ["Grokking the System Design Interview"]
            }
        ]
