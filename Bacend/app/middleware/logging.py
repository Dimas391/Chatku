"""
app/middleware/logging.py
Middleware untuk logging setiap request & response.
Berguna untuk debugging dan monitoring.
"""
import logging
import time
import uuid
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("chatku.access")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """Log setiap HTTP request dengan waktu eksekusi."""

    # Path yang tidak perlu di-log (terlalu noisy)
    SKIP_PATHS = {"/health", "/", "/docs", "/redoc", "/openapi.json"}

    async def dispatch(self, request: Request, call_next):
        if request.url.path in self.SKIP_PATHS:
            return await call_next(request)

        request_id = str(uuid.uuid4())[:8]
        start = time.perf_counter()

        # Tambahkan request ID ke state (bisa dipakai di route)
        request.state.request_id = request_id

        logger.info(
            "→ [%s] %s %s | IP: %s",
            request_id,
            request.method,
            request.url.path,
            request.client.host if request.client else "?",
        )

        try:
            response = await call_next(request)
        except Exception as exc:
            duration_ms = (time.perf_counter() - start) * 1000
            logger.error(
                "✗ [%s] %s %s | ERROR: %s | %.0fms",
                request_id,
                request.method,
                request.url.path,
                exc,
                duration_ms,
            )
            raise

        duration_ms = (time.perf_counter() - start) * 1000
        status_code = response.status_code
        level = logging.WARNING if status_code >= 400 else logging.INFO

        logger.log(
            level,
            "← [%s] %s %s | %d | %.0fms",
            request_id,
            request.method,
            request.url.path,
            status_code,
            duration_ms,
        )

        # Tambahkan request ID ke response header
        response.headers["X-Request-ID"] = request_id
        return response
