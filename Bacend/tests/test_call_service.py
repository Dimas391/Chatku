"""
tests/test_call_service.py
Unit tests untuk CallService.
"""
import sys, os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.call_service import CallService
from app.models.call import CallType, CallState


@pytest.mark.asyncio
async def test_get_ice_servers():
    """Test konfigurasi ICE server dikembalikan dengan benar."""
    servers = CallService.get_ice_servers()
    assert len(servers) >= 1
    # Minimal harus ada STUN server Google
    all_urls = [url for s in servers for url in s.urls]
    assert any("stun" in url for url in all_urls)


@pytest.mark.asyncio
async def test_get_active_call_none():
    """Test cek active call untuk user yang tidak dalam panggilan."""
    with patch("app.services.call_service.cache_get") as mock_cache:
        mock_cache.return_value = None
        result = await CallService.get_active_call("user_123")
    assert result is None


@pytest.mark.asyncio
async def test_initiate_call_when_busy():
    """Test inisiasi panggilan gagal ketika callee sedang sibuk."""
    with patch.object(CallService, "get_active_call") as mock_active:
        mock_active.return_value = "existing_call_id"
        result = await CallService.initiate_call(
            caller_id="caller_1",
            callee_id="callee_1",
            chat_id="chat_1",
            call_type=CallType.AUDIO,
        )
    assert result["success"] is False
    assert result["reason"] == "busy"


@pytest.mark.asyncio
async def test_update_call_state():
    """Test update state panggilan."""
    mock_call_data = {
        "call_id": "test_call",
        "caller_id": "user_1",
        "callee_id": "user_2",
        "state": CallState.RINGING,
        "type": CallType.AUDIO,
    }
    with patch("app.services.call_service.cache_get") as mock_get, \
         patch("app.services.call_service.cache_set") as mock_set, \
         patch("app.services.call_service.get_collection") as mock_col:

        mock_get.return_value = mock_call_data
        mock_set.return_value = None
        mock_col.return_value.update_one = AsyncMock(return_value=MagicMock())

        result = await CallService.update_call_state("test_call", CallState.ANSWERED)
    assert result is True
