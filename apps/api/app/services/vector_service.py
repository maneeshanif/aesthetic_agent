"""Qdrant-backed RAG: chunking, embedding, tenant-scoped retrieval.

Every point payload carries ``spa_id`` and every query filters on it, so a
tenant can only ever retrieve its own knowledge.
"""

from __future__ import annotations

import uuid
from typing import Any, Protocol

from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import AsyncQdrantClient
from qdrant_client import models as qmodels

from app.core.settings import get_settings

EMBED_DIM = 768  # text-embedding-004
_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=150, separators=["\n\n", "\n", ". ", " ", ""]
)


def chunk_text(text: str) -> list[str]:
    return [c.strip() for c in _splitter.split_text(text) if c.strip()]


class Embedder(Protocol):
    async def embed(self, texts: list[str]) -> list[list[float]]: ...


class GeminiEmbedder:
    """Wraps ``google-genai`` embeddings (``text-embedding-004``)."""

    def __init__(self, api_key: str, model: str):
        self._api_key = api_key
        self._model = model

    async def embed(self, texts: list[str]) -> list[list[float]]:
        from google import genai  # imported lazily so tests need no key

        client = genai.Client(api_key=self._api_key)
        out: list[list[float]] = []
        for t in texts:
            resp = client.models.embed_content(model=self._model, contents=t)
            out.append(list(resp.embeddings[0].values))
        return out


class VectorService:
    def __init__(
        self,
        client: AsyncQdrantClient | Any,
        embedder: Embedder,
        collection: str,
    ):
        self._client = client
        self._embedder = embedder
        self._collection = collection

    @classmethod
    def from_settings(cls) -> VectorService:
        s = get_settings()
        client = AsyncQdrantClient(url=s.qdrant_url, api_key=s.qdrant_api_key or None)
        embedder = GeminiEmbedder(s.gemini_api_key, s.gemini_embed_model)
        return cls(client, embedder, s.qdrant_collection)

    async def ensure_collection(self) -> None:
        existing = await self._client.get_collections()
        names = {c.name for c in existing.collections}
        if self._collection not in names:
            await self._client.create_collection(
                collection_name=self._collection,
                vectors_config=qmodels.VectorParams(
                    size=EMBED_DIM, distance=qmodels.Distance.COSINE
                ),
            )

    def _tenant_filter(
        self, spa_id: uuid.UUID, document_id: uuid.UUID | None = None
    ) -> qmodels.Filter:
        must: list[qmodels.FieldCondition] = [
            qmodels.FieldCondition(
                key="spa_id", match=qmodels.MatchValue(value=str(spa_id))
            )
        ]
        if document_id is not None:
            must.append(
                qmodels.FieldCondition(
                    key="document_id", match=qmodels.MatchValue(value=str(document_id))
                )
            )
        return qmodels.Filter(must=must)

    async def upsert_chunks(
        self,
        spa_id: uuid.UUID,
        document_id: uuid.UUID,
        chunks: list[str],
        source_filename: str,
    ) -> int:
        if not chunks:
            return 0
        vectors = await self._embedder.embed(chunks)
        points = [
            qmodels.PointStruct(
                id=str(uuid.uuid4()),
                vector=vec,
                payload={
                    "spa_id": str(spa_id),
                    "document_id": str(document_id),
                    "chunk_index": i,
                    "text": chunk,
                    "source_filename": source_filename,
                },
            )
            for i, (chunk, vec) in enumerate(zip(chunks, vectors, strict=True))
        ]
        await self._client.upsert(collection_name=self._collection, points=points)
        return len(points)

    async def search(
        self, spa_id: uuid.UUID, query: str, limit: int = 5
    ) -> list[dict[str, Any]]:
        vector = (await self._embedder.embed([query]))[0]
        results = await self._client.search(
            collection_name=self._collection,
            query_vector=vector,
            query_filter=self._tenant_filter(spa_id),
            limit=limit,
        )
        out: list[dict[str, Any]] = []
        for r in results:
            payload = r.payload or {}
            out.append(
                {
                    "chunk_id": str(r.id),
                    "score": float(r.score),
                    "source": payload.get("source_filename", "unknown"),
                    "text": payload.get("text", ""),
                }
            )
        return out

    async def delete_document(self, spa_id: uuid.UUID, document_id: uuid.UUID) -> None:
        await self._client.delete(
            collection_name=self._collection,
            points_selector=qmodels.FilterSelector(
                filter=self._tenant_filter(spa_id, document_id)
            ),
        )
