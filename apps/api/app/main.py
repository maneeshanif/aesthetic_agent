"""FastAPI ASGI entrypoint for Vespera AI (Phase 1).

Commit 1 provides the application shell only: settings-driven CORS, a uniform
error envelope, and health/readiness probes. Feature routers are registered in
Commit 2.
"""

from __future__ import annotations

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import __version__
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


def _error(code: str, message: str, http_status: int) -> JSONResponse:
    return JSONResponse(
        status_code=http_status,
        content={"error": {"code": code, "message": message}},
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(_: Request, exc: StarletteHTTPException) -> JSONResponse:
    return _error(
        code=f"http_{exc.status_code}",
        message=str(exc.detail),
        http_status=exc.status_code,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return _error(
        code="validation_error",
        message="Request validation failed.",
        http_status=status.HTTP_422_UNPROCESSABLE_ENTITY,
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_: Request, exc: Exception) -> JSONResponse:  # noqa: ARG001
    return _error(
        code="internal_error",
        message="An unexpected error occurred.",
        http_status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )


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


# Commit 2 registers: auth, tenant, patient, knowledge, chat routers under /api/v1.
