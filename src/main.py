"""Main FastAPI application entrypoint for DopamineScan.

Serves REST API endpoints and hosts the zero-latency static interactive web client.
"""

from __future__ import annotations

import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from .api.routes import router as api_router
from .api.schemas import HealthCheckResponse

app = FastAPI(
    title="DopamineScan API",
    description=(
        "Micro-psychometric assessment platform evaluating psychomotor reaction times (PVT), "
        "inhibitory impulse control (Go/No-Go), immediate working memory, and digital screen saturation."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for open web client access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach API routes
app.include_router(api_router)


@app.get("/health", response_model=HealthCheckResponse, tags=["System"])
async def health_check() -> HealthCheckResponse:
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        service="dopaminescan-engine",
    )


# Mount static files (HTML, CSS, JS) if directory exists
BASE_DIR = Path(__file__).resolve().parent.parent
STATIC_CSS = BASE_DIR / "css"
STATIC_JS = BASE_DIR / "js"
STATIC_ASSETS = BASE_DIR / "assets"
INDEX_FILE = BASE_DIR / "index.html"

if STATIC_CSS.exists():
    app.mount("/css", StaticFiles(directory=str(STATIC_CSS)), name="css")
if STATIC_JS.exists():
    app.mount("/js", StaticFiles(directory=str(STATIC_JS)), name="js")
if STATIC_ASSETS.exists():
    app.mount("/assets", StaticFiles(directory=str(STATIC_ASSETS)), name="assets")


@app.get("/", include_in_schema=False)
async def serve_index():
    if INDEX_FILE.exists():
        return FileResponse(str(INDEX_FILE))
    return {"message": "DopamineScan API operational. Visit /docs for interactive API."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)
