"""RAG plumbing: chunking + tenant-filtered Qdrant calls."""

from __future__ import annotations

import types
import uuid

import pytest
from qdrant_client import models as qmodels

from app.services.vector_service import VectorService, chunk_text


class FakeEmbedder:
    def __init__(self):
        self.calls: list[list[str]] = []

    async def embed(self, texts: list[str]) -> list[list[float]]:
        self.calls.append(texts)
        return [[0.01 * (i + 1)] * 768 for i, _ in enumerate(texts)]


class FakeQdrant:
    def __init__(self, collections: list[str] | None = None):
        self._collections = collections or []
        self.upserted: list = []
        self.deleted: list = []
        self.searched: list = []
        self.created: list[str] = []

    async def get_collections(self):
        cols = [types.SimpleNamespace(name=n) for n in self._collections]
        return types.SimpleNamespace(collections=cols)

    async def create_collection(self, collection_name, vectors_config):
        self.created.append(collection_name)
        self._collections.append(collection_name)

    async def upsert(self, collection_name, points):
        self.upserted.extend(points)

    async def search(self, collection_name, query_vector, query_filter, limit):
        self.searched.append(query_filter)
        return [
            types.SimpleNamespace(
                id="pt-1", score=0.87, payload={"text": "Botox $12/u", "source_filename": "menu.pdf"}
            )
        ][:limit]

    async def delete(self, collection_name, points_selector):
        self.deleted.append(points_selector)


@pytest.fixture
def svc():
    q = FakeQdrant(collections=["vespera_knowledge"])
    return VectorService(q, FakeEmbedder(), "vespera_knowledge"), q


def test_chunk_text_splits_long_input_and_handles_edges() -> None:
    assert chunk_text("") == []
    assert chunk_text("short line") == ["short line"]
    long = ("Paragraph about lasers. " * 200).strip()
    chunks = chunk_text(long)
    assert len(chunks) > 1
    assert all(len(c) <= 1200 for c in chunks)


@pytest.mark.asyncio
async def test_upsert_chunks_tags_every_point_with_tenant(svc) -> None:
    service, q = svc
    spa_id, doc_id = uuid.uuid4(), uuid.uuid4()

    n = await service.upsert_chunks(spa_id, doc_id, ["a", "b", "c"], "menu.pdf")

    assert n == 3
    assert len(q.upserted) == 3
    for i, pt in enumerate(q.upserted):
        assert pt.payload["spa_id"] == str(spa_id)
        assert pt.payload["document_id"] == str(doc_id)
        assert pt.payload["chunk_index"] == i
        assert pt.payload["source_filename"] == "menu.pdf"


@pytest.mark.asyncio
async def test_search_filters_by_spa_and_maps_results(svc) -> None:
    service, q = svc
    spa_id = uuid.uuid4()

    results = await service.search(spa_id, "how much is botox", limit=3)

    flt = q.searched[0]
    assert isinstance(flt, qmodels.Filter)
    keys = {c.key: c.match.value for c in flt.must}
    assert keys == {"spa_id": str(spa_id)}
    assert results[0] == {
        "chunk_id": "pt-1",
        "score": 0.87,
        "source": "menu.pdf",
        "text": "Botox $12/u",
    }


@pytest.mark.asyncio
async def test_delete_document_scopes_selector_to_spa_and_doc(svc) -> None:
    service, q = svc
    spa_id, doc_id = uuid.uuid4(), uuid.uuid4()

    await service.delete_document(spa_id, doc_id)

    selector = q.deleted[0]
    conds = {c.key: c.match.value for c in selector.filter.must}
    assert conds == {"spa_id": str(spa_id), "document_id": str(doc_id)}


@pytest.mark.asyncio
async def test_ensure_collection_creates_only_when_missing() -> None:
    q = FakeQdrant(collections=[])
    svc = VectorService(q, FakeEmbedder(), "vespera_knowledge")
    await svc.ensure_collection()
    await svc.ensure_collection()
    assert q.created == ["vespera_knowledge"]
