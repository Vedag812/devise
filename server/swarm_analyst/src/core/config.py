import os
from dotenv import load_dotenv
from google import genai
from pydantic_settings import BaseSettings

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    GEMINI_API_KEY_1: str = os.getenv("GEMINI_API_KEY_1", "")
    GEMINI_API_KEY_2: str = os.getenv("GEMINI_API_KEY_2", "")
    DEFAULT_MODEL: str = os.getenv("DEFAULT_MODEL", "gemini-1.5-flash") # Switched to Flash for reliability/speed in V2
    PORT: int = int(os.getenv("PORT", 8000))
    HOST: str = os.getenv("HOST", "0.0.0.0")

    @property
    def api_keys(self):
        return [k for k in [self.GEMINI_API_KEY_1, self.GEMINI_API_KEY_2] if k]

settings = Settings()

# Round-robin key counter for rate limit mitigation
_key_index = 0

def get_genai_client():
    """
    Returns a modern GenAI client with key rotation.
    """
    global _key_index
    keys = settings.api_keys
    if not keys:
        raise ValueError("No GEMINI_API_KEY found in environment.")
    
    current_key = keys[_key_index % len(keys)]
    _key_index += 1
    
    return genai.Client(api_key=current_key)

# Global default client (Legacy compatibility if needed)
default_client = get_genai_client()
