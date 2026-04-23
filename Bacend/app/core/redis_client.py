import json
import logging
from typing import Optional, Any
import redis.asyncio as aioredis # type: ignore

from app.core.config import settings

logger = logging.getLogger(__name__)


class RedisClient:
    """Singleton Redis client."""

    _client: Optional[aioredis.Redis] = None

    @classmethod
    async def connect(cls) -> None:
        try:
            cls._client = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
                max_connections=20,
            )
            await cls._client.ping()
            logger.info("Redis terhubung.")
        except Exception as exc:
            logger.warning("Redis tidak tersedia: %s. Beberapa fitur mungkin terbatas.", exc)
            cls._client = None

    @classmethod
    async def disconnect(cls) -> None:
        if cls._client:
            await cls._client.aclose()
            logger.info("🔌 Redis diputus.")

    @classmethod
    def get_client(cls) -> Optional[aioredis.Redis]:
        return cls._client


# ── Helper functions ──────────────────────────────────────
async def set_otp(key: str, otp: str, expire_seconds: int = 300) -> bool:
    """Simpan OTP ke Redis dengan TTL (default 5 menit)."""
    client = RedisClient.get_client()
    if not client:
        return False
    await client.setex(f"otp:{key}", expire_seconds, otp)
    return True


async def get_otp(key: str) -> Optional[str]:
    """Ambil OTP dari Redis."""
    client = RedisClient.get_client()
    if not client:
        return None
    return await client.get(f"otp:{key}")


async def delete_otp(key: str) -> None:
    """Hapus OTP setelah berhasil diverifikasi."""
    client = RedisClient.get_client()
    if client:
        await client.delete(f"otp:{key}")


async def set_user_online(user_id: str, socket_id: str) -> None:
    """Tandai user sebagai online dengan socket_id."""
    client = RedisClient.get_client()
    if client:
        await client.hset("online_users", user_id, socket_id)
        await client.expire("online_users", 3600)


async def set_user_offline(user_id: str) -> None:
    """Hapus user dari daftar online."""
    client = RedisClient.get_client()
    if client:
        await client.hdel("online_users", user_id)


async def get_online_users() -> dict:
    """Ambil semua user yang sedang online."""
    client = RedisClient.get_client()
    if not client:
        return {}
    return await client.hgetall("online_users")


async def is_user_online(user_id: str) -> bool:
    """Cek apakah user sedang online."""
    client = RedisClient.get_client()
    if not client:
        return False
    return bool(await client.hexists("online_users", user_id))


async def cache_set(key: str, value: Any, expire_seconds: int = 3600) -> None:
    """Generic cache setter."""
    client = RedisClient.get_client()
    if client:
        await client.setex(key, expire_seconds, json.dumps(value))


async def cache_get(key: str) -> Optional[Any]:
    """Generic cache getter."""
    client = RedisClient.get_client()
    if not client:
        return None
    raw = await client.get(key)
    return json.loads(raw) if raw else None


async def cache_delete(key: str) -> None:
    """Hapus cache entry."""
    client = RedisClient.get_client()
    if client:
        await client.delete(key)
