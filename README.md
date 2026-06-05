# German Legal Assistant

An AI-powered research tool for querying German law in natural language. Ask questions in English or German and get grounded answers with citations — all running locally, completely free, no API keys required.

Covers six laws: **BGB · HGB · DSGVO · GG · ArbZG · KSchG**

---

## Features

- **Natural language search** over German legal documents
- **Bilingual** — ask in English or German, get answers in the same language
- **Multi-turn conversation** — follow-up questions retain context
- **Law filter** — narrow retrieval to a specific law with one click
- **Source citations** — every answer links back to the exact document and page
- **Streaming responses** — answers appear token by token as the model generates them
- **Fully offline** — LLM runs locally via Ollama, embeddings via sentence-transformers

---

## Tech Stack

| Layer | Technology |
|---|---|
| LLM | [Ollama](https://ollama.com) · `llama3.2:3b` (runs on Apple Silicon GPU) |
| Embeddings | `paraphrase-multilingual-MiniLM-L12-v2` via sentence-transformers |
| Vector store | ChromaDB (local file, no server needed) |
| RAG framework | LangChain LCEL |
| Backend | FastAPI + uvicorn |
| Frontend | Next.js 14 · TypeScript · Tailwind CSS |

---

## Project Structure

```
├── backend/
│   ├── config.py            # All settings via pydantic-settings
│   ├── ingest/
│   │   └── ingest.py        # One-time PDF → ChromaDB ingestion
│   ├── chains/
│   │   └── rag_chain.py     # Retrieval + generation chain
│   ├── api/
│   │   └── main.py          # FastAPI app (/health, /laws, /query, /query/stream)
│   └── tests/               # pytest suite
├── frontend/                # Next.js 14 app
│   ├── app/page.tsx         # Chat UI
│   └── components/          # LawSelector, ChatMessages, QuestionInput, SourceCard
└── data/
    └── raw/                 # PDF files (not committed — see below)
```

---

## Setup

### Prerequisites

- **Python 3.11** via [conda](https://docs.conda.io)
- **Node.js 18+**
- **Ollama** — install via `brew install --cask ollama`, then open the app once to start the service

### 1. Clone and create the Python environment

```bash
git clone https://github.com/SonaliGodavarthy/LegalAIAssitant.git
cd LegalAIAssitant

conda create -n LegalAI python=3.11 -y
conda activate LegalAI
pip install -r backend/requirements.txt
```

### 2. Pull the LLM

```bash
ollama pull llama3.2:3b
```

### 3. Add the legal PDFs

The PDFs are not included in this repository. Place them in `data/raw/` following this layout:

```
data/raw/
├── bgb/       german_bgb.pdf   english_bgb.pdf
├── hgb/       german_hgb.pdf   english_hgb.pdf
├── gg/        german_gg.pdf    english_gg.pdf
├── dsgvo/     german_dsgvo.pdf
├── arbzg/     german_arbzg.pdf
└── kschg/     german_kschg.pdf
```

### 4. Ingest the documents

This step chunks the PDFs, embeds them, and writes the ChromaDB vector store to `data/chroma_db/`. Run it once:

```bash
conda activate LegalAI
python backend/ingest/ingest.py

# To force a full re-ingest:
python backend/ingest/ingest.py --force
```

---

## Running the App

**Backend** (keep this terminal open):

```bash
conda activate LegalAI
uvicorn backend.api.main:app --reload --port 8000
```

**Frontend** (separate terminal):

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/laws` | List of supported laws with metadata |
| `POST` | `/query` | Synchronous question → answer + sources |
| `POST` | `/query/stream` | Streaming SSE answer + sources |

### Query request body

```json
{
  "question": "What are the rules for contract termination under BGB?",
  "law_filter": "bgb",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

`law_filter` and `history` are optional. `history` enables multi-turn conversation context.

---

## Running Tests

```bash
conda activate LegalAI
cd backend
pytest tests/ -v
```

---

## How It Works

1. **Ingestion** — PDFs are split into ~800-token chunks with overlap. Each chunk is embedded with `paraphrase-multilingual-MiniLM-L12-v2` and stored in ChromaDB with metadata: `law`, `source`, `language`, `page`.

2. **Query** — The user's question is embedded with the same model. ChromaDB returns the top-3 most similar chunks (filtered by law if a filter is active).

3. **Generation** — The retrieved chunks are injected into a system prompt alongside the conversation history. `llama3.2:3b` generates a grounded answer, citing specific sections. The model is instructed to:
   - Answer only from the retrieved context — no hallucination
   - Respond in the same language as the question (translating German context into English if needed)
   - Refuse questions outside the scope of German law

4. **Streaming** — The answer is streamed token by token over SSE. Source citations are appended as a final event once generation is complete.
