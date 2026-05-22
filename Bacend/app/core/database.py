from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase # type: ignore
from typing import Optional
import logging

from app.core.config import settings

logger = logging.getLogger(__name__)

class Database:
    """Singleton wrapper untuk koneksi MongoDB."""

    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect(cls) -> None:
        """Buka koneksi ke MongoDB Atlas."""
        try:
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URL,
                maxPoolSize=50,
                minPoolSize=10,
                serverSelectionTimeoutMS=5000,
            )
            cls.db = cls.client[settings.MONGODB_DB_NAME]

            # Ping untuk verifikasi koneksi
            await cls.client.admin.command("ping")
            logger.info(
                "Terhubung ke MongoDB Atlas: %s", settings.MONGODB_DB_NAME
            )
        except Exception as exc:
            logger.error(" Gagal terhubung ke MongoDB: %s", exc)
            raise

    @classmethod
    async def disconnect(cls) -> None:
        """Tutup koneksi MongoDB."""
        if cls.client:
            cls.client.close()
            logger.info("🔌 Koneksi MongoDB ditutup.")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        if cls.db is None:
            raise RuntimeError("Database belum diinisialisasi. Panggil connect() terlebih dahulu.")
        return cls.db


# ── Dependency FastAPI ─────────────────────────────────────
async def get_database() -> AsyncIOMotorDatabase:
    """FastAPI dependency untuk mendapatkan instance database."""
    return Database.get_db()


# ── Helpers koleksi ───────────────────────────────────────
def get_collection(name: str):
    return Database.get_db()[name]
