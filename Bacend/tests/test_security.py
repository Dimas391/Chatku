"""
tests/test_security.py
Unit tests untuk fungsi keamanan (JWT, password, OTP).
"""
import pytest
import time
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_otp,
    generate_random_string,
)


def test_password_hashing():
    """Test hash dan verifikasi password."""
    password = "Password@123"
    hashed = hash_password(password)

    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_password_hash_unique():
    """Dua hash dari password sama harus berbeda (salt unik)."""
    p = "SamePassword"
    h1 = hash_password(p)
    h2 = hash_password(p)
    assert h1 != h2
    assert verify_password(p, h1)
    assert verify_password(p, h2)


def test_create_and_decode_access_token():
    """Test buat dan decode JWT access token."""
    token = create_access_token("user_123")
    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == "user_123"
    assert payload["type"] == "access"


def test_create_and_decode_refresh_token():
    """Test buat dan decode JWT refresh token."""
    token = create_refresh_token("user_456")
    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == "user_456"
    assert payload["type"] == "refresh"


def test_decode_invalid_token():
    """Test decode token tidak valid."""
    result = decode_token("ini.bukan.token.valid")
    assert result is None


def test_decode_empty_token():
    """Test decode token kosong."""
    result = decode_token("")
    assert result is None


def test_generate_otp_length():
    """Test panjang OTP yang dihasilkan."""
    otp4 = generate_otp(4)
    otp6 = generate_otp(6)
    otp8 = generate_otp(8)

    assert len(otp4) == 4
    assert len(otp6) == 6
    assert len(otp8) == 8
    assert otp6.isdigit()


def test_generate_otp_unique():
    """OTP yang dihasilkan harus unik (kemungkinan besar)."""
    otps = {generate_otp(6) for _ in range(10)}
    # Dengan 10^6 kemungkinan, 10 OTP hampir pasti tidak ada yang sama
    assert len(otps) > 1


def test_generate_random_string():
    """Test generate random string."""
    s1 = generate_random_string(32)
    s2 = generate_random_string(32)

    assert len(s1) == 32
    assert len(s2) == 32
    assert s1 != s2
    assert s1.isalnum()


def test_token_extra_data():
    """Test token dengan data tambahan."""
    token = create_access_token("user_789", extra_data={"role": "admin"})
    payload = decode_token(token)

    assert payload is not None
    assert payload["sub"] == "user_789"
    assert payload.get("role") == "admin"
