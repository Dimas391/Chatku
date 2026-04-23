"""
app/middleware/rate_limit.py
Rate limiting sederhana menggunakan Redis.
Mencegah abuse API terutama endpoint OTP.
"""
import logging
import time
from typing import Optional
from fastapi import Request, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.redis_client import RedisClient

logger = logging.getLogger(__name__)


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Middleware rate limiting berbasis IP + endpoint.
    Konfigurasi default: 60 request/menit per IP.
    Endpoint OTP: 5 request/menit per IP (lebih ketat).
    """

    LIMITS = {
        "/api/v1/auth/send-otp": (5, 60),      # 5 req per 60 detik
        "/api/v1/auth/verify-otp": (10, 60),   # 10 req per 60 detik
        "default": (60, 60),                    # 60 req per 60 detik
    }

    async def dispatch(self, request: Request, call_next):
        # Skip untuk health check dan docs
        if request.url.path in ("/health", "/", "/docs", "/redoc", "/openapi.json"):
            return await call_next(request)

        client_ip = self._get_client_ip(request)
        path = request.url.path

        # Tentukan limit berdasarkan endpoint
        max_requests, window = self.LIMITS.get(path, self.LIMITS["default"])

        # Cek limit
        is_limited = await self._check_rate_limit(client_ip, path, max_requests, window)
        if is_limited:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Terlalu banyak permintaan. Coba lagi dalam {window} detik.",
                headers={"Retry-After": str(window)},
            )

        response = await call_next(request)
        return response

    @staticmethod
    def _get_client_ip(request: Request) -> str:
        """Ambil IP asli klien (support proxy/load balancer)."""
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            return forwarded.split(",")[0].strip()
        return request.client.host if request.client else "unknown"

    @staticmethod
    async def _check_rate_limit(
        ip: str, path: str, max_requests: int, window: int
    ) -> bool:
        """Cek apakah IP sudah melebihi batas. Return True jika di-limit."""
        client = RedisClient.get_client()
        if not client:
            return False  # Jika Redis tidak ada, skip rate limiting

        key = f"rate:{ip}:{path}"
        try:
            current = await client.incr(key)
            if current == 1:
                await client.expire(key, window)
            return current > max_requests
        except Exception:
            return False
