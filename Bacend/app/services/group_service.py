import logging
from datetime import datetime, timezone
from typing import Optional

from bson import ObjectId # type: ignore

from app.core.database import get_collection

logger = logging.getLogger(__name__)


class GroupService:
    """Layanan manajemen grup chat."""

    @staticmethod
    async def get_group(chat_id: str) -> Optional[dict]:
        if not ObjectId.is_valid(chat_id):
            return None
        return await get_collection("chats").find_one(
            {"_id": ObjectId(chat_id), "type": "group", "is_active": True}
        )

    @staticmethod
    async def is_member(chat_id: str, user_id: str) -> bool:
        chat = await GroupService.get_group(chat_id)
        return chat is not None and user_id in chat.get("participants", [])

    @staticmethod
    async def is_admin(chat_id: str, user_id: str) -> bool:
        chat = await GroupService.get_group(chat_id)
        return chat is not None and user_id in chat.get("admins", [])

    @staticmethod
    async def get_member_count(chat_id: str) -> int:
        chat = await GroupService.get_group(chat_id)
        return len(chat.get("participants", [])) if chat else 0

    @staticmethod
    async def dissolve_group(chat_id: str, user_id: str) -> bool:
        """Bubarkan grup (hanya creator)."""
        chat = await GroupService.get_group(chat_id)
        if not chat or chat.get("created_by") != user_id:
            return False
        await get_collection("chats").update_one(
            {"_id": ObjectId(chat_id)},
            {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}},
        )
        logger.info("Grup %s dibubarkan oleh %s", chat_id, user_id)
        return True
