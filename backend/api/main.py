import sys
from contextlib import asynccontextmanager
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

import chains.rag_chain as rag_chain
from config import settings

SUPPORTED_LAWS = [
    {"id": "bgb", "name": "Bürgerliches Gesetzbuch", "name_en": "German Civil Code", "languages": ["german", "english"]},
    {"id": "hgb", "name": "Handelsgesetzbuch", "name_en": "German Commercial Code", "languages": ["german", "english"]},
    {"id": "dsgvo", "name": "Datenschutz-Grundverordnung", "name_en": "General Data Protection Regulation (GDPR)", "languages": ["german"]},
    {"id": "gg", "name": "Grundgesetz", "name_en": "Basic Law (German Constitution)", "languages": ["german", "english"]},
    {"id": "arbzg", "name": "Arbeitszeitgesetz", "name_en": "Working Hours Act", "languages": ["german"]},
    {"id": "kschg", "name": "Kündigungsschutzgesetz", "name_en": "Dismissal Protection Act", "languages": ["german"]},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    rag_chain._ensure_loaded()
    yield


app = FastAPI(title="German Legal AI Assistant", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Accept", "Authorization"],
)


class QueryRequest(BaseModel):
    question: str

    @field_validator("question")
    @classmethod
    def question_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("question must not be empty")
        return v.strip()


class QueryResponse(BaseModel):
    answer: str
    sources: list[dict]


def _to_sse(data: str) -> str:
    """Format a string as a valid SSE data event, handling embedded newlines."""
    lines = data.split("\n")
    return "\n".join(f"data: {line}" for line in lines) + "\n\n"


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/laws")
def list_laws():
    return SUPPORTED_LAWS


@app.post("/query", response_model=QueryResponse)
def query_endpoint(request: QueryRequest):
    try:
        result = rag_chain.query(request.question)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return QueryResponse(answer=result["answer"], sources=result["sources"])


@app.post("/query/stream")
async def query_stream_endpoint(request: QueryRequest):
    async def event_generator():
        try:
            async for token in rag_chain.async_query_stream(request.question):
                yield _to_sse(token)
        except Exception as e:
            yield _to_sse(f"[ERROR]{str(e)}")

    return StreamingResponse(event_generator(), media_type="text/event-stream")
