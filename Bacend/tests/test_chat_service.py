"""
tests/test_chat_service.py
Unit tests untuk ChatService.
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from datetime import datetime, timezone

from app.services.chat_service import ChatService
from app.models.chat import MessageType, MessageStatus


@pytest.mark.asyncio
async def test_format_message():
    """Test format pesan dari dokumen MongoDB."""
    mock_doc = {
        "_id": MagicMock(__str__=lambda self: "msg_id_123"),
        "chat_id": "chat_1",
        "sender_id": "user_1",
        "type": MessageType.TEXT,
        "content": "Halo!",
        "media_url": None,
        "reply_to_id": None,
        "is_deleted": False,
        "status": MessageStatus.SENT,
        "read_by": [],
        "call_status": None,
        "call_duration": None,
        "call_type": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = ChatService.format_message(mock_doc)
    assert result["chat_id"] == "chat_1"
    assert result["sender_id"] == "user_1"
    assert result["content"] == "Halo!"
    assert result["type"] == MessageType.TEXT
    assert result["is_deleted"] is False


@pytest.mark.asyncio
async def test_get_messages_empty():
    """Test ambil pesan di chat kosong."""
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.to_list = AsyncMock(return_value=[])

    with patch("app.services.chat_service.get_collection") as mock_col:
        mock_col.return_value.find.return_value = mock_cursor
        messages = await ChatService.get_messages(
            chat_id="chat_1", user_id="user_1", limit=50
        )

    assert messages == []


@pytest.mark.asyncio
async def test_get_unread_count():
    """Test hitung pesan belum terbaca."""
    with patch("app.services.chat_service.get_collection") as mock_col:
        mock_col.return_value.count_documents = AsyncMock(return_value=5)
        count = await ChatService.get_unread_count("chat_1", "user_1")

    assert count == 5
