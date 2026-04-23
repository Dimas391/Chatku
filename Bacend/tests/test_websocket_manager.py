"""
tests/test_websocket_manager.py
Unit tests untuk ConnectionManager (WebSocket).
"""
import pytest
import json
from unittest.mock import AsyncMock, MagicMock

from app.services.websocket_manager import ConnectionManager


@pytest.fixture
def conn_manager():
    return ConnectionManager()


@pytest.mark.asyncio
async def test_connect_disconnect(conn_manager):
    """Test koneksi dan putus koneksi WebSocket."""
    mock_ws = AsyncMock()
    await conn_manager.connect(mock_ws, "user_1")

    assert conn_manager.is_online("user_1")
    assert mock_ws in conn_manager.active_connections["user_1"]

    conn_manager.disconnect(mock_ws, "user_1")
    assert not conn_manager.is_online("user_1")


@pytest.mark.asyncio
async def test_send_to_user_online(conn_manager):
    """Test kirim pesan ke user yang online."""
    mock_ws = AsyncMock()
    await conn_manager.connect(mock_ws, "user_1")

    result = await conn_manager.send_to_user("user_1", {"event": "test"})
    assert result is True
    mock_ws.send_text.assert_called_once()


@pytest.mark.asyncio
async def test_send_to_user_offline(conn_manager):
    """Test kirim pesan ke user yang offline."""
    result = await conn_manager.send_to_user("offline_user", {"event": "test"})
    assert result is False


@pytest.mark.asyncio
async def test_join_and_broadcast(conn_manager):
    """Test broadcast ke chat room."""
    mock_ws1 = AsyncMock()
    mock_ws2 = AsyncMock()

    await conn_manager.connect(mock_ws1, "user_1")
    await conn_manager.connect(mock_ws2, "user_2")
    conn_manager.join_chat("user_1", "chat_abc")
    conn_manager.join_chat("user_2", "chat_abc")

    await conn_manager.broadcast_to_chat(
        "chat_abc", {"event": "new_message"}, exclude_user_id="user_1"
    )

    # user_1 dikecualikan, user_2 harus terima
    mock_ws1.send_text.assert_not_called()
    mock_ws2.send_text.assert_called_once()


@pytest.mark.asyncio
async def test_total_connections(conn_manager):
    """Test hitung total koneksi aktif."""
    mock_ws1 = AsyncMock()
    mock_ws2 = AsyncMock()

    await conn_manager.connect(mock_ws1, "user_1")
    await conn_manager.connect(mock_ws2, "user_2")

    assert conn_manager._total_connections() == 2

    conn_manager.disconnect(mock_ws1, "user_1")
    assert conn_manager._total_connections() == 1


def test_get_online_user_ids(conn_manager):
    """Test daftar user yang online."""
    assert conn_manager.get_online_user_ids() == []
