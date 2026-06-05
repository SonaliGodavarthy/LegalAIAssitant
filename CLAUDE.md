# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

LegalAIAssistant is a German legal research assistant that lets users search and understand German laws (BGB, HGB, DSGVO, GG, ArbZG, KSchG) in natural language. It uses RAG over German legal PDFs with a Next.js frontend and a FastAPI backend. **Entirely free — no paid APIs.**

## Git repository

`https://github.com/SonaliGodavarthy/LegalAIAssitant.git`

## Architecture

```
LegalAIAssistant/
├── backend/
│   ├── config.py          # All settings via pydantic-settings
│   ├── ingest/
│   │   └── ingest.py      # One-time PDF → ChromaDB ingestion script
│   ├── chains/
│   │   └── rag_chain.py   # LangChain LCEL retrieval + generation chain
│   ├── tests/
│   │   └── test_*.py      # pytest suite (40 tests)
│   └── api/
│       └── main.py        # FastAPI app (/health, /laws, /query, /query/stream)
├── frontend/              # Next.js 14 app (TypeScript + Tailwind)
└── data/
    ├── raw/               # Downloaded PDFs, organised by law name
    │   ├── bgb/           # german_bgb.pdf, english_bgb.pdf
    │   ├── hgb/           # german_hgb.pdf, english_hgb.pdf
    │   ├── gg/            # german_gg.pdf, english_gg.pdf
    │   ├── dsgvo/         # german_dsgvo.pdf
    │   ├── arbzg/         # german_arbzg.pdf
    │   └── kschg/         # german_kschg.pdf
    └── chroma_db/         # ChromaDB vector store (auto-created by ingest)
```

## Zero-cost stack

| Component | Tool | Cost |
|---|---|---|
| LLM | Ollama (`llama3.2:3b`) — runs locally on Apple Silicon GPU | Free |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` via sentence-transformers | Free |
| Vector DB | ChromaDB (local file) | Free |
| Backend | FastAPI + uvicorn | Free |
| Frontend | Next.js | Free |

No API keys required.

## Environment setup

All Python dependencies run inside the **`LegalAI` conda environment** (Python 3.11).

```bash
conda activate LegalAI          # activate before any backend work
```

To recreate from scratch:
```bash
conda create -n LegalAI python=3.11 -y
conda activate LegalAI
pip install -r backend/requirements.txt
```

**Ollama** must be running (installed via `brew install --cask ollama`). Open the Ollama app once to start the service, then:
```bash
ollama pull llama3.2:3b         # download model once (~2GB)
```

## Development commands

### One-time ingestion (run before starting the API)
```bash
conda activate LegalAI
python backend/ingest/ingest.py           # ingest all PDFs into ChromaDB
python backend/ingest/ingest.py --force   # re-ingest (wipes and rebuilds)
```

### Backend
```bash
conda activate LegalAI
uvicorn backend.api.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Next.js dev server
npm run build
npm run lint
```

### Test a query
```bash
curl -X POST http://localhost:8000/query \
  -H "Content-Type: application/json" \
  -d '{"question": "What are the rules for contract termination under German law?"}'
```

## Key conventions

- **RAG flow**: PDF → `ingest.py` chunks + embeds → ChromaDB. At query time: embed question → retrieve top-3 chunks → llama3.2:3b generates grounded answer streamed token-by-token.
- **LLM config**: model name lives only in `config.py` (`LLM_MODEL`). Change the model there, not in chain code.
- **Metadata on every chunk**: `law` (e.g. `bgb`), `source` (filename), `language` (`german`/`english`), `page`. Used for source citations in responses.
- **No hallucination policy**: the system prompt instructs the model to answer only from retrieved context and state explicitly when it cannot find an answer.
- **Environment variables**: `.env` at project root (never commit). Backend reads via `pydantic-settings`. See `backend/.env.example`.
- **Legal documents**: never log document content, only IDs and metadata. `data/raw/` and `data/chroma_db/` are in `.gitignore`.
