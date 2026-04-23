"""
tests/test_helpers.py
Unit tests untuk fungsi helper.
"""
import pytest
from app.utils.helpers import (
    is_valid_phone,
    is_valid_email,
    format_phone_number,
    mask_phone,
    mask_email,
    truncate_text,
    sanitize_string,
    build_pagination_query,
)


def test_valid_phone():
    assert is_valid_phone("081234567890") is True
    assert is_valid_phone("+6281234567890") is True
    assert is_valid_phone("0812") is False       # terlalu pendek
    assert is_valid_phone("abc") is False


def test_valid_email():
    assert is_valid_email("user@example.com") is True
    assert is_valid_email("user.name+tag@domain.co.id") is True
    assert is_valid_email("invalid-email") is False
    assert is_valid_email("@domain.com") is False


def test_format_phone_number():
    assert format_phone_number("081234567890", "+62") == "+6281234567890"
    assert format_phone_number("812 3456 7890", "+62") == "+6281234567890"


def test_mask_phone():
    masked = mask_phone("+6281234567890")
    assert "***" in masked
    assert masked.startswith("+628")
    assert masked.endswith("7890")


def test_mask_email():
    masked = mask_email("username@example.com")
    assert "**" in masked
    assert "@example.com" in masked


def test_truncate_text():
    long_text = "A" * 200
    result = truncate_text(long_text, max_length=50)
    assert len(result) <= 50
    assert result.endswith("...")

    short_text = "Halo"
    assert truncate_text(short_text, max_length=50) == short_text


def test_sanitize_string():
    dirty = "<script>alert('xss')</script>"
    clean = sanitize_string(dirty)
    assert "<" not in clean
    assert ">" not in clean


def test_pagination_query():
    result = build_pagination_query(skip=0, limit=20)
    assert result["skip"] == 0
    assert result["limit"] == 20

    # Limit tidak boleh melebihi 100
    result = build_pagination_query(skip=-5, limit=999)
    assert result["skip"] == 0
    assert result["limit"] == 100
