from pathlib import Path
from pydantic_settings import BaseSettings

PROJECT_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    CHROMA_PERSIST_DIR: str = "data/chroma_db"
    DATA_RAW_DIR: str = "data/raw"
    COLLECTION_NAME: str = "german_laws"
    EMBED_MODEL: str = "paraphrase-multilingual-MiniLM-L12-v2"
    CHUNK_SIZE: int = 800
    CHUNK_OVERLAP: int = 100
    TOP_K: int = 3
    LLM_MODEL: str = "llama3.2:3b"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_NUM_CTX: int = 2048
    OLLAMA_NUM_PREDICT: int = 512
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    model_config = {"env_file": str(PROJECT_ROOT / ".env"), "extra": "ignore"}


settings = Settings()
