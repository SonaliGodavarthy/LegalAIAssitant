# German Legal Intelligence Assistant

A RAG-powered web application that helps legal teams, compliance officers, HR teams, and businesses search, understand, and interact with German laws and regulations in natural language.

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- Pinecone account (free tier available)

### Local Development

1. **Clone and setup:**
```bash
git clone <repo>
cd LegalAIAssistant
```

2. **Backend setup:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Pinecone API key
```

3. **Frontend setup:**
```bash
cd frontend
npm install
```

4. **Run services:**

**Option A: Local (requires Ollama running separately)**
```bash
# Terminal 1: Backend
cd backend
uvicorn app.main:app --reload

# Terminal 2: Frontend
cd frontend
npm start

# Terminal 3: Ollama (download models first)
ollama pull mistral:7b
ollama serve
```

**Option B: Docker Compose**
```bash
docker-compose up --build
```

Access the app at `http://localhost:3000`

## Project Structure

See `CLAUDE.md` for detailed architecture, development workflows, and critical context about legal/compliance considerations.

```
.
├── backend/              # FastAPI server
├── frontend/             # React UI
├── data_pipeline/        # Document ingestion
├── docker-compose.yml    # Local dev orchestration
└── CLAUDE.md            # Developer documentation
```

## Documentation

- **CLAUDE.md** - Architecture, tech stack, development workflows, and legal considerations
- **backend/.env.example** - Configuration template

## License

[Your License Here]
