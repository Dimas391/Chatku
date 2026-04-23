"""
tests/conftest.py
Konfigurasi pytest dan fixtures untuk testing.
"""
import asyncio
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from unittest.mock import AsyncMock, patch

from app.main import app
from app.core.security import create_access_token


@pytest.fixture(scope="session")
def event_loop():
    """Override default event loop untuk pytest-asyncio."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture
async def client():
    """HTTP client untuk testing API endpoints."""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as c:
        yield c


@pytest.fixture
def auth_headers():
    """Header autentikasi dengan token testing."""
    token = create_access_token(subject="test_user_id_123")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_db():
    """Mock MongoDB collection."""
    with patch("app.core.database.get_collection") as mock:
        mock.return_value = AsyncMock()
        yield mock


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    with patch("app.core.redis_client.RedisClient.get_client") as mock:
        mock.return_value = AsyncMock()
        yield mock
