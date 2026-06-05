import json
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from config import settings, PROJECT_ROOT as _ROOT
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough

SYSTEM_PROMPT = """You are a German legal expert assistant. Answer questions using ONLY the provided legal context.

Rules:
- Cite the specific law and section when referencing a rule (e.g., "According to §242 BGB...").
- If the answer is not found in the context, state clearly: "This information is not available in the provided legal documents."
- Answer in the same language as the user's question (German question → German answer, English question → English answer).
- Do not speculate or add information not present in the context.

Context:
{context}"""

HUMAN_PROMPT = "{question}"


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
    retriever = vector_store.as_retriever(search_kwargs={"k": settings.TOP_K})

    llm = ChatOllama(
        model=settings.LLM_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0,
    )

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        ("human", HUMAN_PROMPT),
    ])

    chain = (
        {"context": retriever | _format_docs, "question": RunnablePassthrough()}
        | prompt
        | llm
        | StrOutputParser()
    )

    return chain, retriever, llm, prompt


_chain = None
_retriever = None
_llm = None
_prompt = None


def _ensure_loaded():
    global _chain, _retriever, _llm, _prompt
    if _chain is None:
        _chain, _retriever, _llm, _prompt = build_chain()


def query(question: str) -> dict:
    _ensure_loaded()
    source_docs = _retriever.invoke(question)
    answer = _chain.invoke(question)
    sources = [
        {
            "law": doc.metadata.get("law", "unknown"),
            "source": doc.metadata.get("source", "unknown"),
            "language": doc.metadata.get("language", "unknown"),
        }
        for doc in source_docs
    ]
    seen = set()
    unique_sources = []
    for s in sources:
        key = (s["law"], s["source"])
        if key not in seen:
            seen.add(key)
            unique_sources.append(s)

    return {"answer": answer, "sources": unique_sources}


async def async_query_stream(question: str):
    """Async generator that yields LLM tokens then a final [SOURCES] event."""
    _ensure_loaded()

    source_docs = await _retriever.ainvoke(question)
    context = _format_docs(source_docs)

    seen: set = set()
    unique_sources: list = []
    for doc in source_docs:
        key = (doc.metadata.get("law"), doc.metadata.get("source"))
        if key not in seen:
            seen.add(key)
            unique_sources.append({
                "law": doc.metadata.get("law", "unknown"),
                "source": doc.metadata.get("source", "unknown"),
                "language": doc.metadata.get("language", "unknown"),
            })

    messages = _prompt.format_messages(context=context, question=question)
    async for chunk in _llm.astream(messages):
        content = chunk.content if hasattr(chunk, "content") else str(chunk)
        if content:
            yield content

    yield f"[SOURCES]{json.dumps(unique_sources)}"
