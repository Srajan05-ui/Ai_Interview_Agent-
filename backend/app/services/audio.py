import os
import base64
import tempfile
from openai import AsyncOpenAI
from elevenlabs.client import AsyncElevenLabs
from elevenlabs import VoiceSettings

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY")

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None
eleven_client = AsyncElevenLabs(api_key=ELEVENLABS_API_KEY) if ELEVENLABS_API_KEY else None

async def transcribe_audio(audio_base64: str) -> str:
    """
    Decodes base64 audio and passes it to OpenAI Whisper for transcription.
    """
    if not openai_client:
        print("Mock STT: OPENAI_API_KEY not set. Falling back to mock transcription.")
        return "[Mock Transcription] I would use a hash map to solve this."
        
    try:
        audio_bytes = base64.b64decode(audio_base64)
        
        # Whisper needs a file-like object with a name ending in a supported format
        # For this we write to a temporary file
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
            
        with open(tmp_path, "rb") as f:
            transcription = await openai_client.audio.transcriptions.create(
                model="whisper-1", 
                file=f
            )
            
        os.remove(tmp_path)
        return transcription.text
    except Exception as e:
        print(f"Error in transcription: {e}")
        return "[Error transcribing audio]"

async def generate_speech(text: str) -> str:
    """
    Generates speech using ElevenLabs and returns base64 encoded audio.
    """
    if not eleven_client:
        print("Mock TTS: ELEVENLABS_API_KEY not set. Falling back to empty audio.")
        return ""
        
    try:
        audio_generator = await eleven_client.text_to_speech.convert(
            voice_id="JBFqnCBsd6RMkjVDRZzb", # Rachel, or similar default
            output_format="mp3_44100_128",
            text=text,
            model_id="eleven_multilingual_v2",
            voice_settings=VoiceSettings(
                stability=0.5,
                similarity_boost=0.8,
                style=0.0,
                use_speaker_boost=True
            )
        )
        
        # audio_generator is an async generator yielding chunks
        audio_bytes = b""
        async for chunk in audio_generator:
            if chunk:
                audio_bytes += chunk
                
        return base64.b64encode(audio_bytes).decode('utf-8')
    except Exception as e:
        print(f"Error in TTS generation: {e}")
        return ""
