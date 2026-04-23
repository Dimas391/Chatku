import logging
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from bson import ObjectId # type: ignore

from app.core.database import get_collection
from app.models.chat import (
    ChatDocument,
    MessageDocument,
    ChatType,
    MessageType,
    MessageStatus
)

logger = logging.getLogger(__name__)


class ChatService:
    """Layanan manajemen chat dan pesan."""

    # ── Chat Room ─────────────────────────────────────────
    @staticmethod
    async def get_or_create_personal_chat(
        user_id: str, participant_id: str
    ) -> Tuple[dict, bool]:
        """
        Ambil atau buat personal chat room antara dua user.
        Returns: (chat_document, is_new)
        """
        chats_col = get_collection("chats")

        # Cari existing chat
        existing = await chats_col.find_one(
            {
                "type": ChatType.PERSONAL,
                "participants": {"$all": [user_id, participant_id], "$size": 2},
            }
        )
        if existing:
            return existing, False

        # Buat chat baru
        new_chat = ChatDocument(
            type=ChatType.PERSONAL,
            participants=[user_id, participant_id],
            created_by=user_id,
        )
        result = await chats_col.insert_one(
            new_chat.model_dump(by_alias=True, exclude={"id"})
        )
        chat = await chats_col.find_one({"_id": result.inserted_id})
        return chat, True

    @staticmethod
    async def create_group_chat(
        creator_id: str,
        name: str,
        participant_ids: List[str],
        description: Optional[str] = None,
    ) -> dict:
        """Buat grup chat baru."""
        chats_col = get_collection("chats")
        all_participants = list({creator_id, *participant_ids})

        new_chat = ChatDocument(
            type=ChatType.GROUP,
            name=name,
            description=description,
            participants=all_participants,
            admins=[creator_id],
            created_by=creator_id,
        )
        result = await chats_col.insert_one(
            new_chat.model_dump(by_alias=True, exclude={"id"})
        )
        return await chats_col.find_one({"_id": result.inserted_id})

    @staticmethod
    async def get_user_chats(user_id: str, skip: int = 0, limit: int = 50) -> List[dict]:
        """Ambil semua chat milik user, diurutkan dari pesan terbaru."""
        chats_col = get_collection("chats")
        cursor = (
            chats_col.find(
                {"participants": user_id, "is_active": True}
            )
            .sort("last_message_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    @staticmethod
    async def get_chat_by_id(chat_id: str, user_id: str) -> Optional[dict]:
        """Ambil chat berdasarkan ID, pastikan user adalah peserta."""
        return await get_collection("chats").find_one(
            {"_id": ObjectId(chat_id), "participants": user_id}
        )

    # ── Messages ──────────────────────────────────────────
    @staticmethod
    async def send_message(
        chat_id: str,
        sender_id: str,
        content: Optional[str],
        msg_type: MessageType = MessageType.TEXT,
        reply_to_id: Optional[str] = None,
        media_url: Optional[str] = None,
        media_size: Optional[int] = None,
        media_duration: Optional[int] = None,
    ) -> dict:
        """Simpan pesan ke database dan update info chat terakhir."""
        messages_col = get_collection("messages")
        chats_col = get_collection("chats")

        new_msg = MessageDocument(
            chat_id=chat_id,
            sender_id=sender_id,
            type=msg_type,
            content=content,
            reply_to_id=reply_to_id,
            media_url=media_url,
            media_size=media_size,
            media_duration=media_duration,
            status=MessageStatus.SENT,
        )
        result = await messages_col.insert_one(
            new_msg.model_dump(by_alias=True, exclude={"id"})
        )
        message = await messages_col.find_one({"_id": result.inserted_id})

        # Update info pesan terakhir di chat room
        preview = content or ("[Media]" if media_url else "[Pesan]")
        await chats_col.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$set": {
                    "last_message_id": str(result.inserted_id),
                    "last_message_text": preview[:100],
                    "last_message_at": datetime.now(timezone.utc),
                    "last_message_by": sender_id,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return message

    @staticmethod
    async def get_messages(
        chat_id: str,
        user_id: str,
        before_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[dict]:
        """
        Ambil pesan di chat room dengan cursor-based pagination.
        'before_id': ambil pesan sebelum message ID ini (untuk load more).
        """
        messages_col = get_collection("messages")
        query: dict = {
            "chat_id": chat_id,
            "deleted_for": {"$nin": [user_id]},
        }
        if before_id:
            query["_id"] = {"$lt": ObjectId(before_id)}

        cursor = (
            messages_col.find(query)
            .sort("_id", -1)
            .limit(limit)
        )
        messages = await cursor.to_list(length=limit)
        return list(reversed(messages))  # balik urutan untuk tampil dari atas

    @staticmethod
    async def mark_messages_read(chat_id: str, user_id: str) -> int:
        """Tandai semua pesan belum terbaca sebagai 'read'. Return jumlah yang diupdate."""
        result = await get_collection("messages").update_many(
            {
                "chat_id": chat_id,
                "sender_id": {"$ne": user_id},
                "read_by": {"$nin": [user_id]},
            },
            {
                "$addToSet": {"read_by": user_id},
                "$set": {
                    "status": MessageStatus.READ,
                    "updated_at": datetime.now(timezone.utc),
                },
            },
        )
        return result.modified_count

    @staticmethod
    async def delete_message(
        message_id: str, user_id: str, delete_for_everyone: bool = False
    ) -> bool:
        """Hapus pesan. Bisa hapus untuk diri sendiri atau semua."""
        messages_col = get_collection("messages")
        message = await messages_col.find_one({"_id": ObjectId(message_id)})
        if not message:
            return False

        if delete_for_everyone and message["sender_id"] == user_id:
            await messages_col.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": {"is_deleted": True, "content": None, "media_url": None}},
            )
        else:
            await messages_col.update_one(
                {"_id": ObjectId(message_id)},
                {"$addToSet": {"deleted_for": user_id}},
            )
        return True

    @staticmethod
    async def get_unread_count(chat_id: str, user_id: str) -> int:
        """Hitung jumlah pesan belum terbaca."""
        return await get_collection("messages").count_documents(
            {
                "chat_id": chat_id,
                "sender_id": {"$ne": user_id},
                "read_by": {"$nin": [user_id]},
            }
        )

    # ── Format untuk response ─────────────────────────────
    @staticmethod
    def format_message(msg: dict) -> dict:
        """Konversi dokumen MongoDB ke dict response."""
        # Pastikan created_at dalam format ISO dengan 'Z' untuk UTC
        created_at = msg["created_at"]
        if isinstance(created_at, datetime):
            # Jika sudah datetime, format dengan 'Z'
            created_at_str = created_at.isoformat() + 'Z'
        else:
            created_at_str = created_at
        
        return {
            "id": str(msg["_id"]),
            "chat_id": msg["chat_id"],
            "sender_id": msg["sender_id"],
            "type": msg["type"],
            "content": msg.get("content"),
            "media_url": msg.get("media_url"),
            "reply_to_id": msg.get("reply_to_id"),
            "is_deleted": msg.get("is_deleted", False),
            "status": msg.get("status", "sent"),
            "read_by": msg.get("read_by", []),
            "call_status": msg.get("call_status"),
            "call_duration": msg.get("call_duration"),
            "call_type": msg.get("call_type"),
            "created_at": created_at_str,
        }
