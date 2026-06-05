import sys
from pathlib import Path

# Add backend/ to path so all backend modules are importable
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

# Import app after sys.path is set — module-level code in main.py runs here
# (imports rag_chain, sets up FastAPI app object) but does NOT call _ensure_loaded yet.
from api.main import app

MOCK_QUERY_RESULT = {
    "answer": "Test answer",
    "sources": [{"law": "bgb", "source": "german_bgb.pdf", "language": "german"}],
}

EXPECTED_LAW_IDS = {"bgb", "hgb", "dsgvo", "gg", "arbzg", "kschg"}


async def _mock_stream(question: str):
    """Async generator that replaces async_query_stream in streaming tests."""
    yield "Token1"
    yield "Token2"
    yield "[SOURCES][]"


@pytest.fixture
def client():
    """TestClient with all external dependencies mocked out."""
    with (
        patch("chains.rag_chain._ensure_loaded"),
        patch("chains.rag_chain.query", return_value=MOCK_QUERY_RESULT),
        patch("chains.rag_chain.async_query_stream", side_effect=_mock_stream),
    ):
        with TestClient(app) as c:
            yield c


# ── /health ──────────────────────────────────────────────────────────────────

def test_health_status_code(client):
    assert client.get("/health").status_code == 200


def test_health_response_body(client):
    assert client.get("/health").json() == {"status": "ok"}


# ── /laws ─────────────────────────────────────────────────────────────────────

def test_laws_status_code(client):
    assert client.get("/laws").status_code == 200


def test_laws_returns_six_items(client):
    assert len(client.get("/laws").json()) == 6


def test_laws_each_item_has_required_keys(client):
    for law in client.get("/laws").json():
        assert "id" in law
        assert "name" in law
        assert "name_en" in law
        assert "languages" in law


def test_laws_includes_all_expected_ids(client):
    ids = {law["id"] for law in client.get("/laws").json()}
    assert ids == EXPECTED_LAW_IDS


def test_laws_languages_are_lists(client):
    for law in client.get("/laws").json():
        assert isinstance(law["languages"], list)
        assert len(law["languages"]) >= 1


# ── POST /query ───────────────────────────────────────────────────────────────

def test_query_valid_question_status_code(client):
    resp = client.post("/query", json={"question": "What is BGB?"})
    assert resp.status_code == 200


def test_query_valid_question_answer_field(client):
    resp = client.post("/query", json={"question": "What is BGB?"})
    assert resp.json()["answer"] == "Test answer"


def test_query_valid_question_sources_field(client):
    resp = client.post("/query", json={"question": "What is BGB?"})
    sources = resp.json()["sources"]
    assert len(sources) == 1
    assert sources[0]["law"] == "bgb"


def test_query_empty_question_returns_422(client):
    assert client.post("/query", json={"question": ""}).status_code == 422


def test_query_whitespace_only_returns_422(client):
    assert client.post("/query", json={"question": "   "}).status_code == 422


def test_query_missing_field_returns_422(client):
    assert client.post("/query", json={}).status_code == 422


def test_query_trims_whitespace(client):
    # Validator strips leading/trailing spaces; padded question should succeed
    resp = client.post("/query", json={"question": "  What is BGB?  "})
    assert resp.status_code == 200


# ── POST /query/stream ────────────────────────────────────────────────────────

def test_query_stream_status_code(client):
    resp = client.post("/query/stream", json={"question": "What is BGB?"})
    assert resp.status_code == 200


def test_query_stream_content_type(client):
    resp = client.post("/query/stream", json={"question": "What is BGB?"})
    assert "text/event-stream" in resp.headers["content-type"]


def test_query_stream_body_contains_sse_data_prefix(client):
    resp = client.post("/query/stream", json={"question": "What is BGB?"})
    assert "data: " in resp.text


def test_query_stream_body_contains_token_content(client):
    resp = client.post("/query/stream", json={"question": "What is BGB?"})
    assert "Token1" in resp.text
    assert "Token2" in resp.text


def test_query_stream_body_contains_sources_event(client):
    resp = client.post("/query/stream", json={"question": "What is BGB?"})
    assert "[SOURCES]" in resp.text


def test_query_stream_empty_question_returns_422(client):
    resp = client.post("/query/stream", json={"question": ""})
    assert resp.status_code == 422
