import pytest
from app.services.llm_router import generate

@pytest.mark.asyncio
async def test_llm_router_fallback(monkeypatch):
    # Ensure no API keys are set so all real providers fail
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.delenv("GOOGLE_API_KEY", raising=False)
    monkeypatch.delenv("GROQ_API_KEY", raising=False)
    monkeypatch.delenv("OPENROUTER_API_KEY", raising=False)
    
    result = await generate("Test prompt")
    
    # Assert that it gracefully degrades to the cached fallback
    assert result.provider == "cached_fallback"
    assert "process and a thread" in result.content or "hash table" in result.content
