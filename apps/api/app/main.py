"""FastAPI ASGI entrypoint for Vespera AI (Phase 1)."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.routers import (
    auth_router,
    chat_router,
    knowledge_router,
    overview_router,
    patient_router,
    tenant_router,
)
from app.core.errors import register_error_handlers
from app.core.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="Vespera AI API",
    version=__version__,
    description="Med-spa lead triage, clinical-protocol RAG, and voice telephony — Phase 1.",
    docs_url="/docs",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_error_handlers(app)

for module in (
    auth_router,
    tenant_router,
    patient_router,
    knowledge_router,
    chat_router,
    overview_router,
):
    app.include_router(module.router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    """Liveness probe."""
    return {
        "status": "ok",
        "service": "vespera-api",
        "version": __version__,
        "env": settings.api_env,
    }


@app.get("/api/v1/health", tags=["system"])
async def health_v1() -> dict[str, str]:
    """Versioned liveness probe (used by the web client)."""
    return {"status": "ok", "version": __version__}
