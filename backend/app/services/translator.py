from app.services.llm_router import generate

TRANSLATE_TO_ENG_PROMPT = """
You are an expert translator. 
Translate the following text into English. If it is already in English, return it exactly as is.
Return ONLY the translated text, with no preamble, quotes, or markdown formatting.

Text: {text}
Language: {source_lang}
"""

TRANSLATE_FROM_ENG_PROMPT = """
You are an expert translator.
Translate the following English text into {target_lang}.
Return ONLY the translated text, with no preamble, quotes, or markdown formatting.

Text: {text}
"""

async def translate_to_english(text: str, source_lang: str) -> str:
    if source_lang.lower() in ["en", "english"]:
        return text
    
    prompt = TRANSLATE_TO_ENG_PROMPT.format(text=text, source_lang=source_lang)
    result = await generate(prompt)
    return result.content.strip()

async def translate_from_english(text: str, target_lang: str) -> str:
    if target_lang.lower() in ["en", "english"]:
        return text
        
    prompt = TRANSLATE_FROM_ENG_PROMPT.format(text=text, target_lang=target_lang)
    result = await generate(prompt)
    return result.content.strip()
