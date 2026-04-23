import re
import uuid
from datetime import datetime, timezone
from typing
from bson import ObjectId # type: ignore


def generate_uuid() -> str:
    """Generate UUID v4 string."""
    return str(uuid.uuid4())


def is_valid_object_id(oid: str) -> bool:
    """Cek apakah string adalah MongoDB ObjectId yang valid."""
    return ObjectId.is_valid(oid)


def sanitize_string(text: str, max_length: int = 500) -> str:
    """Bersihkan string dari karakter berbahaya dan batasi panjang."""
    cleaned = re.sub(r"[<>\"'&]", "", text.strip())
    return cleaned[:max_length]


def is_valid_phone(phone: str) -> bool:
    """Validasi format nomor telepon (minimal 10 digit)."""
    digits = re.sub(r"\D", "", phone)
    return 10 <= len(digits) <= 15


def is_valid_email(email: str) -> bool:
    """Validasi format email sederhana."""
    pattern = r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$"
    return bool(re.match(pattern, email))


def format_phone_number(phone: str, country_code: str = "+62") -> str:
    """
    Normalisasi nomor telepon Indonesia.
    Contoh: '0812-3456-7890' → '+6281234567890'
    """
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("0"):
        digits = digits[1:]
    if not digits.startswith(country_code.lstrip("+")):
        digits = country_code.lstrip("+") + digits
    return f"+{digits}"


def now_utc() -> datetime:
    """Waktu sekarang dalam UTC."""
    return datetime.now(timezone.utc)


def mask_phone(phone: str) -> str:
    """Sensor nomor telepon. Contoh: '+6281234567890' → '+628***7890'."""
    if len(phone) <= 6:
        return phone
    return phone[:4] + "***" + phone[-4:]


def mask_email(email: str) -> str:
    """Sensor email. Contoh: 'user@example.com' → 'us**@example.com'."""
    parts = email.split("@")
    if len(parts) != 2:
        return email
    name, domain = parts
    masked = name[:2] + "**" if len(name) > 2 else name
    return f"{masked}@{domain}"


def truncate_text(text: str, max_length: int = 100, suffix: str = "...") -> str:
    """Potong teks jika terlalu panjang."""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def build_pagination_query(skip: int = 0, limit: int = 20) -> dict:
    """Validasi dan kembalikan parameter pagination yang aman."""
    skip = max(0, skip)
    limit = min(max(1, limit), 100)  # max 100 per page
    return {"skip": skip, "limit": limit}
