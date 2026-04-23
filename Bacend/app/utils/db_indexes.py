import logging
from pymongo import ASCENDING, DESCENDING, TEXT  # type: ignore
from app.core.database import get_collection

logger = logging.getLogger(__name__)


async def create_indexes() -> None:
    """Membuat semua index MongoDB. Aman dipanggil berulang kali."""
    try:
        await _create_user_indexes()
        await _create_chat_indexes()
        await _create_message_indexes()
        await _create_call_indexes()
        await _create_otp_indexes()
        logger.info("Semua MongoDB indexes berhasil dibuat.")
    except Exception as exc:
        logger.warning("Gagal membuat beberapa indexes: %s", exc)


async def _create_user_indexes() -> None:
    col = get_collection("users")

    # Unique hanya jika field benar-benar ada dan bertipe string
    await col.create_index(
        [("phone", ASCENDING)],
        unique=True,
        name="unique_phone_if_exists",
        partialFilterExpression={"phone": {"$type": "string"}},
    )

    await col.create_index(
        [("email", ASCENDING)],
        unique=True,
        name="unique_email_if_exists",
        partialFilterExpression={"email": {"$type": "string"}},
    )

    await col.create_index(
        [("username", ASCENDING)],
        unique=True,
        name="unique_username_if_exists",
        partialFilterExpression={"username": {"$type": "string"}},
    )

    await col.create_index([("auth_type", ASCENDING)], name="idx_auth_type")
    await col.create_index([("is_active", ASCENDING)], name="idx_is_active")
    await col.create_index([("is_online", ASCENDING)], name="idx_is_online")

    # Full-text search untuk pencarian user
    await col.create_index(
        [("display_name", TEXT), ("username", TEXT)],
        name="user_text_search",
    )

    logger.debug("Index users berhasil dibuat.")


async def _create_chat_indexes() -> None:
    col = get_collection("chats")

    await col.create_index([("participants", ASCENDING)], name="idx_chat_participants")
    await col.create_index([("type", ASCENDING)], name="idx_chat_type")
    await col.create_index([("last_message_at", DESCENDING)], name="idx_last_message_at")

    await col.create_index(
        [("type", ASCENDING), ("participants", ASCENDING)],
        name="chat_type_participants",
    )

    logger.debug("Index chats berhasil dibuat.")


async def _create_message_indexes() -> None:
    col = get_collection("messages")

    await col.create_index(
        [("chat_id", ASCENDING), ("_id", DESCENDING)],
        name="chat_messages_cursor",
    )

    await col.create_index(
        [("chat_id", ASCENDING), ("sender_id", ASCENDING), ("read_by", ASCENDING)],
        name="unread_count",
    )

    await col.create_index([("type", ASCENDING)], name="idx_message_type")
    await col.create_index([("is_deleted", ASCENDING)], name="idx_is_deleted")

    logger.debug("Index messages berhasil dibuat.")


async def _create_call_indexes() -> None:
    col = get_collection("calls")

    await col.create_index([("call_id", ASCENDING)], unique=True, name="unique_call_id")

    await col.create_index(
        [("participants", ASCENDING), ("created_at", DESCENDING)],
        name="user_call_history",
    )

    await col.create_index([("state", ASCENDING)], name="idx_call_state")
    await col.create_index([("chat_id", ASCENDING)], name="idx_call_chat_id")

    logger.debug("Index calls berhasil dibuat.")


async def _create_otp_indexes() -> None:
    """OTP fallback collection jika Redis tidak tersedia."""
    col = get_collection("otp_fallback")

    await col.create_index([("key", ASCENDING)], unique=True, name="unique_otp_key")

    await col.create_index(
        [("created_at", ASCENDING)],
        expireAfterSeconds=600,
        name="otp_ttl",
    )

    logger.debug("Index otp_fallback berhasil dibuat.")