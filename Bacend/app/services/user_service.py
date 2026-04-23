import logging
from datetime import datetime, timezone
from typing import Optional, List

from bson import ObjectId # type: ignore

from app.core.database import get_collection
from app.services.websocket_manager import manager

logger = logging.getLogger(__name__)


class UserService:
    """Layanan manajemen pengguna."""

    @staticmethod
    async def get_by_id(user_id: str) -> Optional[dict]:
        """Ambil user berdasarkan ID."""
        if not ObjectId.is_valid(user_id):
            return None
        return await get_collection("users").find_one(
            {"_id": ObjectId(user_id), "is_active": True}
        )

    @staticmethod
    async def get_by_phone(phone: str) -> Optional[dict]:
        return await get_collection("users").find_one({"phone": phone})

    @staticmethod
    async def get_by_email(email: str) -> Optional[dict]:
        return await get_collection("users").find_one({"email": email})

    @staticmethod
    async def search_users(
        query: str,
        exclude_id: str,
        limit: int = 20,
    ) -> List[dict]:
        """Cari user berdasarkan nama, username, atau nomor telepon."""
        cursor = get_collection("users").find(
            {
                "_id": {"$ne": ObjectId(exclude_id)},
                "is_active": True,
                "$or": [
                    {"display_name": {"$regex": query, "$options": "i"}},
                    {"username": {"$regex": query, "$options": "i"}},
                    {"phone": {"$regex": query, "$options": "i"}},
                ],
            }
        ).limit(limit)
        return await cursor.to_list(length=limit)

    @staticmethod
    def format_public(user: dict) -> dict:
        """Format data user untuk respons publik."""
        return {
            "id": str(user["_id"]),
            "username": user.get("username", ""),
            "display_name": user.get("display_name", ""),
            "avatar_url": user.get("avatar_url"),
            "bio": user.get("bio", ""),
            "is_online": manager.is_online(str(user["_id"])),
            "last_seen": user.get(
                "last_seen", datetime.now(timezone.utc)
            ).isoformat(),
        }

    @staticmethod
    async def update_last_seen(user_id: str) -> None:
        """Update last_seen timestamp user."""
        await get_collection("users").update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"last_seen": datetime.now(timezone.utc)}},
        )

    @staticmethod
    async def set_online(user_id: str, is_online: bool) -> None:
        """Update status online user."""
        await get_collection("users").update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_online": is_online,
                    "last_seen": datetime.now(timezone.utc)
                    if not is_online
                    else None,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
