import logging
import signal
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI # type: ignore
from fastapi.middleware.cors import CORSMiddleware # type: ignore
from fastapi.middleware.gzip import GZipMiddleware # type: ignore
from fastapi.responses import JSONResponse # type: ignore
from fastapi.staticfiles import StaticFiles # type: ignore

from app.core.config import settings
from app.core.database import Database
from app.core.redis_client import RedisClient
from app.api.routes import auth, chat,  users, calls, websocket, groups, notifications, media, contacts, security, admin,dashboard

from app.api.routes import video_calls
from app.utils.db_indexes import create_indexes
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.logging import RequestLoggingMiddleware
import os

# Stub function to satisfy joblib/pickle when loading the model
# This is needed because the model was saved in an environment where this function existed
def preprocessing_lengkap(text):
    return text

# Logging 
logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)

#  Lifecycle
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup dan shutdown lifecycle."""
    logger.info(" Memulai %s v%s ...", settings.APP_NAME, settings.APP_VERSION)

    # Connect ke database
    await Database.connect()
    await RedisClient.connect()

    # Buat indexes MongoDB
    await create_indexes()

    logger.info("Semua layanan siap.")
    yield

    # Shutdown — beri timeout agar tidak menggantung selamanya
    logger.info("Mematikan server ...")
    try:
        await asyncio.wait_for(Database.disconnect(), timeout=5.0)
    except (asyncio.TimeoutError, Exception) as e:
        logger.warning("Database disconnect timeout/error: %s", e)
    try:
        await asyncio.wait_for(RedisClient.disconnect(), timeout=3.0)
    except (asyncio.TimeoutError, Exception) as e:
        logger.warning("Redis disconnect timeout/error: %s", e)
    logger.info("Server berhenti.")
    
os.makedirs("uploads/avatars", exist_ok=True)
os.makedirs("uploads/chat", exist_ok=True)


# App Instance 
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
## ChatKu Backend API

Backend untuk aplikasi chat real-time dengan fitur:
- Autentikasi via OTP (WhatsApp/SMS/Email)
- Chat personal & grup
- Kirim media (gambar, video, audio, file)
- Voice Call (WebRTC)
- Video Call (WebRTC)
- Push notification
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(RateLimitMiddleware)
app.add_middleware(RequestLoggingMiddleware)


# ── Exception Handlers ────────────────────────────────────
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(status_code=404, content={"detail": "Endpoint tidak ditemukan"})


@app.exception_handler(500)
async def server_error_handler(request, exc):
    logger.error("Internal server error: %s", exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Terjadi kesalahan server. Silakan coba lagi."},
    )


# ── Routes ────────────────────────────────────────────────
API_PREFIX = "/api/v1"

# Routes HTTP (dengan prefix /api/v1)
app.include_router(auth.router,          prefix=API_PREFIX)
app.include_router(users.router,         prefix=API_PREFIX)
app.include_router(chat.router,          prefix=API_PREFIX)
app.include_router(groups.router,        prefix=API_PREFIX)
app.include_router(calls.router,         prefix=API_PREFIX)
app.include_router(notifications.router, prefix=API_PREFIX)
app.include_router(media.router,         prefix=API_PREFIX)
app.include_router(video_calls.router,   prefix=API_PREFIX)
app.include_router(contacts.router,      prefix=API_PREFIX)
app.include_router(security.router,      prefix=API_PREFIX)
app.include_router(admin.router,         prefix=API_PREFIX)
app.include_router(dashboard.router,     prefix=API_PREFIX) 
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# PERBAIKAN: WebSocket router TANPA prefix
app.include_router(websocket.router)  # Tidak pakai prefix

# ── Health Check ──────────────────────────────────────────
@app.get("/", tags=["Health"])
async def root():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
async def health_check():
    """Endpoint health check untuk monitoring / load balancer."""
    db_ok = Database.db is not None
    redis_ok = RedisClient.get_client() is not None
    return {
        "status": "healthy" if db_ok else "degraded",
        "database": "connected" if db_ok else "disconnected",
        "redis": "connected" if redis_ok else "disconnected",
        "version": settings.APP_VERSION,
    }