import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from config import settings, PROJECT_ROOT as _ROOT
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage

MAX_HISTORY = 6  # cap at 3 back-and-forths to stay within num_ctx

SYSTEM_PROMPT = """You are a specialist German legal assistant. Your ONLY function is answering questions about German law.

STRICT RULES — follow without exception:
1. SCOPE: If the question is NOT about German law or the German legal system, respond ONLY with: "I can only answer questions about German law. Please ask about BGB, HGB, DSGVO, GG, ArbZG, or KSchG." Do NOT attempt to answer non-legal questions under any circumstances.
2. GROUNDING: Answer ONLY using the legal context provided below. Do not use outside knowledge.
3. CITATIONS: Cite the specific law and section (e.g. "According to §242 BGB...").
4. NOT FOUND: If the answer is not in the context, say: "This information is not available in the provided legal documents."
5. LANGUAGE: Always reply in the language of the user's latest message — regardless of the language of the legal context documents. If the user writes in English, your entire response MUST be in English, even if the retrieved context is in German (translate the relevant parts). If the user writes in German, respond in German. Never mix languages.
6. No speculation. No information beyond what the context contains.

Legal Context:
{context}"""


def _format_docs(docs) -> str:
    return "\n\n".join(
        f"[{d.metadata.get('law', 'unknown').upper()} | {d.metadata.get('source', '')} | p.{d.metadata.get('page', '?')}]\n{d.page_content}"
        for d in docs
    )


def build_chain():
    chroma_dir = _ROOT / settings.CHROMA_PERSIST_DIR
    embeddings = HuggingFaceEmbeddings(model_name=settings.EMBED_MODEL)
    vector_store = Chroma(
        collection_name=settings.COLLECTION_NAME,
        embedding_function=embeddings,
        persist_directory=str(chroma_dir),
    )
    llm = ChatOllama(
        model=settings.LLM_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0,
        num_ctx=settings.OLLAMA_NUM_CTX,
        num_predict=settings.OLLAMA_NUM_PREDICT,
    )
    return vector_store, llm


_vector_store: "Chroma | None" = None
_llm: "ChatOllama | None" = None


def _ensure_loaded():
    global _vector_store, _llm
    if _vector_store is None:
        _vector_store, _llm = build_chain()


def _get_retriever(law_filter: str | None = None):
    search_kwargs: dict = {"k": settings.TOP_K}
    if law_filter:
        search_kwargs["filter"] = {"law": law_filter.lower()}
    return _vector_store.as_retriever(search_kwargs=search_kwargs)


def _build_messages(context: str, question: str, history: list[dict]) -> list:
    msgs: list = [SystemMessage(content=SYSTEM_PROMPT.format(context=context))]
    for h in history[-MAX_HISTORY:]:
        role, content = h.get("role", ""), h.get("content", "")
        if role == "user":
            msgs.append(HumanMessage(content=content))
        elif role == "assistant":
            msgs.append(AIMessage(content=content))
    msgs.append(HumanMessage(content=question))
    return msgs


def _dedup_sources(source_docs) -> list[dict]:
    seen: set = set()
    unique: list = []
    for doc in source_docs:
        key = (doc.metadata.get("law"), doc.metadata.get("source"))
        if key not in seen:
            seen.add(key)
            unique.append({
                "law": doc.metadata.get("law", "unknown"),
                "source": doc.metadata.get("source", "unknown"),
                "language": doc.metadata.get("language", "unknown"),
            })
    return unique


def query(question: str, law_filter: str | None = None, history: list[dict] | None = None) -> dict:
    _ensure_loaded()
    source_docs = _get_retriever(law_filter).invoke(question)
    messages = _build_messages(_format_docs(source_docs), question, history or [])
    response = _llm.invoke(messages)
    answer = response.content if hasattr(response, "content") else str(response)
    return {"answer": answer, "sources": _dedup_sources(source_docs)}


async def async_query_stream(question: str, law_filter: str | None = None, history: list[dict] | None = None):
    """Async generator: yields LLM tokens then a final [SOURCES] SSE event."""
    _ensure_loaded()
    source_docs = await _get_retriever(law_filter).ainvoke(question)
    messages = _build_messages(_format_docs(source_docs), question, history or [])
    unique_sources = _dedup_sources(source_docs)

    async for chunk in _llm.astream(messages):
        content = chunk.content if hasattr(chunk, "content") else str(chunk)
        if content:
            yield content

    yield f"[SOURCES]{json.dumps(unique_sources)}"
