import argparse
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from config import settings, PROJECT_ROOT
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_chroma import Chroma


def detect_language(filename: str) -> str:
    if filename.startswith("german_"):
        return "german"
    if filename.startswith("english_"):
        return "english"
    return "unknown"


def load_pdfs(raw_dir: Path) -> list:
    documents = []
    for pdf_path in sorted(raw_dir.rglob("*.pdf")):
        law = pdf_path.parent.name
        language = detect_language(pdf_path.name)
        print(f"  Loading {pdf_path.name} ({law}, {language})...")
        loader = PyPDFLoader(str(pdf_path))
        pages = loader.load()
        for page in pages:
            page.metadata["source"] = pdf_path.name
            page.metadata["law"] = law
            page.metadata["language"] = language
        documents.extend(pages)
        print(f"    -> {len(pages)} pages")
    return documents


def main():
    parser = argparse.ArgumentParser(description="Ingest legal PDFs into ChromaDB")
    parser.add_argument("--force", action="store_true", help="Re-ingest even if collection already has documents")
    args = parser.parse_args()

    chroma_dir = PROJECT_ROOT / settings.CHROMA_PERSIST_DIR
    raw_dir = PROJECT_ROOT / settings.DATA_RAW_DIR

    embeddings = HuggingFaceEmbeddings(model_name=settings.EMBED_MODEL)

    # Check if collection already has documents
    if not args.force and chroma_dir.exists():
        existing = Chroma(
            collection_name=settings.COLLECTION_NAME,
            embedding_function=embeddings,
            persist_directory=str(chroma_dir),
        )
        count = existing._collection.count()
        if count > 0:
            print(f"Collection '{settings.COLLECTION_NAME}' already has {count} chunks. Use --force to re-ingest.")
            return

    print("Loading PDFs...")
    documents = load_pdfs(raw_dir)
    print(f"Total pages loaded: {len(documents)}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
    )
    chunks = splitter.split_documents(documents)
    print(f"Total chunks after splitting: {len(chunks)}")

    print("Embedding and storing in ChromaDB...")
    chroma_dir.mkdir(parents=True, exist_ok=True)

    Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        collection_name=settings.COLLECTION_NAME,
        persist_directory=str(chroma_dir),
    )
    print(f"Done. {len(chunks)} chunks stored in '{settings.COLLECTION_NAME}'.")


if __name__ == "__main__":
    main()
