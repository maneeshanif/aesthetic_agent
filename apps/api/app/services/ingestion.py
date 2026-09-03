"""RAG ingestion pipeline: bytes → text → chunks → Qdrant, tracking status on the
``knowledge_documents`` row."""

from __future__ import annotations

import io
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UnprocessableError
from app.models.orm import KnowledgeDocument
from app.services.vector_service import VectorService, chunk_text

MAX_BYTES = 10 * 1024 * 1024


def detect_file_type(filename: str, content_type: str | None) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf") or (content_type == "application/pdf"):
        return "pdf"
    if lower.endswith((".md", ".markdown", ".txt")) or (content_type or "").startswith("text/"):
        return "markdown"
    raise UnprocessableError(
        "Only PDF and Markdown files are supported.", code="unsupported_file_type"
    )


def extract_text(raw: bytes, file_type: str) -> str:
    if file_type == "markdown":
        return raw.decode("utf-8", errors="replace")
    if file_type == "pdf":
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(raw))
        return "\n\n".join((page.extract_text() or "") for page in reader.pages)
    raise UnprocessableError(f"Unknown file type: {file_type}", code="unsupported_file_type")


async def ingest_document(
    session: AsyncSession,
    vector_service: VectorService,
    doc: KnowledgeDocument,
    raw: bytes,
) -> KnowledgeDocument:
    """Run the pipeline synchronously (Phase 1); Phase 3 moves this to Celery."""
    try:
        doc.status = "chunking"
        await session.flush()

        text = extract_text(raw, doc.file_type)
        if not text.strip():
            raise UnprocessableError("No extractable text in document.", code="empty_document")

        chunks = chunk_text(text)
        count = await vector_service.upsert_chunks(doc.spa_id, doc.id, chunks, doc.filename)

        doc.status = "embedded"
        doc.chunk_count = count
        doc.error_message = None
        doc.embedded_at = datetime.utcnow()
    except Exception as exc:  # noqa: BLE001 — record failure, surface via row
        doc.status = "failed"
        doc.chunk_count = 0
        doc.error_message = str(exc)[:500]
    await session.flush()
    return doc
