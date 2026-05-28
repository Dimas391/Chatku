"""
app/middleware/auth.py
Dependency FastAPI untuk autentikasi JWT.
Digunakan sebagai parameter fungsi route: current_user = Depends(get_current_user)
"""
import logging
from typing import Optional

from fastapi import Depends, HTTPException, status # type: ignore
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials # type: ignore
from bson import ObjectId # type: ignore

from app.core.security import decode_token
from app.core.database import get_collection

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Dependency: Validasi JWT token dan kembalikan data user.
    Raise 401 jika token tidak valid atau user tidak ditemukan.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau telah kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    payload = decode_token(credentials.credentials)
    if not payload:
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    token_type: Optional[str] = payload.get("type")

    if not user_id or token_type != "access":
        raise credentials_exception

    # Ambil user dari database
    try:
        user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
    except Exception:
        raise credentials_exception

    if not user:
        raise credentials_exception

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda telah dinonaktifkan",
        )

    return user


async def get_current_user_id(
    current_user: dict = Depends(get_current_user),
) -> str:
    """Shortcut dependency: hanya butuh user_id."""
    return str(current_user["_id"])


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> Optional[dict]:
    """Dependency opsional: tidak raise error jika tidak ada token."""
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


# ─── Admin Auth Dependencies ─────────────────────────────────────────────────

async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
) -> dict:
    """
    Dependency khusus admin: Validasi JWT, pastikan is_admin=True,
    dan cari data admin di koleksi 'admins' (bukan 'users').
    Raise 401 jika token tidak valid, 403 jika bukan admin.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token admin tidak valid atau telah kedaluwarsa",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    payload = decode_token(credentials.credentials)
    if not payload:
        raise credentials_exception

    # Pastikan tipe token adalah access
    token_type: Optional[str] = payload.get("type")
    if token_type != "access":
        raise credentials_exception

    # Pastikan token memiliki flag is_admin
    is_admin = payload.get("is_admin", False)
    if not is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akses ditolak: bukan token admin",
        )

    admin_id: Optional[str] = payload.get("sub")
    if not admin_id:
        raise credentials_exception

    # Cari di koleksi admins, BUKAN users
    try:
        admin = await get_collection("admins").find_one({"_id": ObjectId(admin_id)})
    except Exception:
        raise credentials_exception

    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Admin tidak ditemukan atau telah dihapus",
        )

    if not admin.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun admin telah dinonaktifkan",
        )

    return admin


async def get_current_admin_id(
    admin: dict = Depends(get_current_admin),
) -> str:
    """Shortcut dependency admin: hanya butuh admin_id."""
    return str(admin["_id"])
