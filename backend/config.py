import os
import logging
from dotenv import load_dotenv

# Force load and override env variables from root .env to prioritize user-configured keys
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, ".env")
load_dotenv(env_path, override=True)

from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # API Keys
    GROQ_API_KEY: str
    GEMINI_API_KEY: str
    MISTRAL_API_KEY: str = ""

    # Supabase / DB Configurations
    SUPABASE_URL: str
    SUPABASE_KEY: str
    DATABASE_URL: str

    # Server Configuration
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    LOG_LEVEL: str = "INFO"

    # Shared Constants
    PROJECT_NAME: str = "OpsBrain AI"
    API_PREFIX: str = "/api/v1"
    VECTOR_DIMENSION: int = 384  # Matching BAAI/bge-small-en-v1.5
    EMBEDDING_MODEL_NAME: str = "BAAI/bge-small-en-v1.5"

    # Settings config
    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

# Try loading from root .env
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(root_dir, ".env")

try:
    settings = Settings(_env_file=env_path)
except Exception as e:
    # If loading fails (e.g. env vars not set), try loading from environment variables directly
    import sys
    print(f"Warning: Failed to load .env from {env_path}: {e}", file=sys.stderr)
    settings = Settings()

# Set up logging configuration
def setup_logging():
    log_level = getattr(logging, settings.LOG_LEVEL.upper(), logging.INFO)
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s [%(levelname)s] %(name)s - %(message)s",
        handlers=[
            logging.StreamHandler()
        ]
    )
    logger = logging.getLogger("opsbrain")
    logger.info(f"Logging initialized at level: {settings.LOG_LEVEL}")
    return logger

logger = setup_logging()
