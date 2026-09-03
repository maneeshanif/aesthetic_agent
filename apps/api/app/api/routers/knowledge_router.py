"""RAG knowledge base: upload / list / delete clinic rule documents."""

from __future__ import annotations

import contextlib
import uuid

from fastapi import APIRouter, Depends, File, Response, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.providers import get_storage, get_vector_service
from app.core.dependencies import SpaContext, get_db, get_spa_context, require_role
from app.core.errors import NotFoundError, UnprocessableError
from app.models.orm import KnowledgeDocument
from app.models.schemas import KnowledgeDocOut
from app.services.ingestion import MAX_BYTES, detect_file_type, ingest_document
from app.services.storage import Storage
from app.services.vector_service import VectorService

router = APIRouter(prefix="/api/v1/knowledge", tags=["knowledge"])


@router.get("/documents", response_model=list[KnowledgeDocOut])
async def list_documents(
    ctx: SpaContext = Depends(get_spa_context),
    session: AsyncSession = Depends(get_db),
) -> list[KnowledgeDocument]:
    rows = await session.scalars(
        select(KnowledgeDocument)
        .where(KnowledgeDocument.spa_id == ctx.spa_id)
        .order_by(KnowledgeDocument.created_at.desc())
    )
    return list(rows)


@router.post("/documents", response_model=KnowledgeDocOut, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    ctx: SpaContext = Depends(require_role("owner", "manager")),
    session: AsyncSession = Depends(get_db),
    storage: Storage = Depends(get_storage),
    vector_service: VectorService = Depends(get_vector_service),
) -> KnowledgeDocument:
    raw = await file.read()
    if not raw:
        raise UnprocessableError("Uploaded file is empty.", code="empty_file")
    if len(raw) > MAX_BYTES:
        raise UnprocessableError("File exceeds the 10 MB limit.", code="file_too_large")

    file_type = detect_file_type(file.filename or "upload", file.content_type)

    doc = KnowledgeDocument(
        spa_id=ctx.spa_id,
        filename=file.filename or "upload",
        file_type=file_type,
        byte_size=len(raw),
        status="uploaded",
        uploaded_by=ctx.user_id,
    )
    session.add(doc)
    await session.flush()

    doc.storage_path = await storage.upload(
        f"{ctx.spa_id}/{doc.id}-{doc.filename}", raw, file.content_type or "application/octet-stream"
    )
    await ingest_document(session, vector_service, doc, raw)
    await session.commit()
    await session.refresh(doc)
    return doc


@router.delete("/documents/{document_id}", status_code=204, response_model=None)
async def delete_document(
    document_id: uuid.UUID,
    ctx: SpaContext = Depends(require_role("owner", "manager")),
    session: AsyncSession = Depends(get_db),
    storage: Storage = Depends(get_storage),
    vector_service: VectorService = Depends(get_vector_service),
) -> None:
    doc = await session.scalar(
        select(KnowledgeDocument).where(
            KnowledgeDocument.id == document_id, KnowledgeDocument.spa_id == ctx.spa_id
        )
    )
    if doc is None:
        raise NotFoundError("Document not found.")

    await vector_service.delete_document(ctx.spa_id, doc.id)
    if doc.storage_path:
        with contextlib.suppress(Exception):  # storage cleanup is best-effort
            await storage.delete(doc.storage_path)
    await session.delete(doc)
    await session.commit()
    return Response(status_code=204)
