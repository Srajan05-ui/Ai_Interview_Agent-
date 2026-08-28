import os
import asyncio
from typing import Dict, Any, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_groq import ChatGroq
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from pydantic import BaseModel

class LLMResult(BaseModel):
    content: str
    provider: str

# In-memory mock cache for graceful degradation
CACHED_QUESTION_BANK = [
    "Could you explain the difference between a process and a thread?",
    "How does a hash table resolve collisions?"
]

async def _call_provider_with_timeout(provider_func, timeout: float = 8.0) -> str:
    try:
        return await asyncio.wait_for(provider_func(), timeout=timeout)
    except asyncio.TimeoutError:
        raise Exception("Provider timed out")

async def generate(prompt: str, response_schema: Optional[Dict[str, Any]] = None) -> LLMResult:
    """
    Tries providers in order: Gemini -> Groq -> OpenRouter -> Cached Fallback
    Returns LLMResult with the content and the provider that successfully served it.
    """
    # 1. Primary: Gemini
    try:
        api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY")
        if api_key:
            llm = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=api_key)
            response = await _call_provider_with_timeout(lambda: llm.ainvoke([HumanMessage(content=prompt)]))
            return LLMResult(content=response.content, provider="gemini")
    except Exception as e:
        print(f"Gemini failed: {e}")

    # 2. Fallback: Groq
    try:
        if os.getenv("GROQ_API_KEY"):
            llm = ChatGroq(
                model="llama-3.1-8b-instant",
                model_kwargs={"response_format": {"type": "json_object"}}
            )
            response = await _call_provider_with_timeout(lambda: llm.ainvoke([HumanMessage(content=prompt)]))
            return LLMResult(content=response.content, provider="groq")
    except Exception as e:
        print(f"Groq failed: {e}")
        
    # 3. Last Resort: OpenRouter :free models
    try:
        if os.getenv("OPENROUTER_API_KEY"):
            # OpenRouter uses the OpenAI SDK format
            llm = ChatOpenAI(
                openai_api_key=os.getenv("OPENROUTER_API_KEY"),
                openai_api_base="https://openrouter.ai/api/v1",
                model="meta-llama/llama-3-8b-instruct:free" 
            )
            response = await _call_provider_with_timeout(lambda: llm.ainvoke([HumanMessage(content=prompt)]))
            return LLMResult(content=response.content, provider="openrouter")
    except Exception as e:
        print(f"OpenRouter failed: {e}")

    # 4. Final Degrade: No LLM call
    # If all three providers fail (or keys missing), return a pre-cached question
    import random
    fallback_content = random.choice(CACHED_QUESTION_BANK)
    return LLMResult(content=fallback_content, provider="cached_fallback")
