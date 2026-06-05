import sys
from pathlib import Path

# Add backend/ to path so config is importable as a top-level module
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pytest
from config import Settings


def test_default_chunk_size():
    assert Settings().CHUNK_SIZE == 800


def test_default_chunk_overlap():
    assert Settings().CHUNK_OVERLAP == 100


def test_default_top_k():
    assert Settings().TOP_K == 5


def test_default_llm_model():
    assert Settings().LLM_MODEL == "mistral"


def test_embed_model_contains_multilingual():
    assert "multilingual" in Settings().EMBED_MODEL


def test_cors_origins_is_list():
    assert isinstance(Settings().CORS_ORIGINS, list)


def test_cors_origins_has_localhost_3000():
    assert "http://localhost:3000" in Settings().CORS_ORIGINS


def test_default_collection_name():
    assert Settings().COLLECTION_NAME == "german_laws"


def test_default_ollama_base_url():
    assert Settings().OLLAMA_BASE_URL == "http://localhost:11434"


def test_env_var_overrides_top_k(monkeypatch):
    monkeypatch.setenv("TOP_K", "10")
    assert Settings().TOP_K == 10


def test_env_var_overrides_llm_model(monkeypatch):
    monkeypatch.setenv("LLM_MODEL", "llama2")
    assert Settings().LLM_MODEL == "llama2"
