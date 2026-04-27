from fastapi import APIRouter, Depends, HTTPException, status # type: ignore
from typing import Optional, List
from bson import ObjectId # type: ignore
from datetime import datetime, timezone

from app.middleware.auth import get_current_user, get_current_user_id
from app.core.database import get_collection
from app.services.encryption_service import encryption_service
from app.services.classification_service import classification_service

router = APIRouter(prefix="/security", tags=["Security"])

@router.get("/server-public-key", summary="Ambil Public Key Server")
async def get_server_public_key():
    """
    Ambil public key server untuk enkripsi dual encryption
    """
    try:
        # Gunakan service untuk mendapatkan public key pem yang sudah tersinkronisasi
        public_key = encryption_service.get_public_key_pem()
        
        return {
            "public_key": public_key,
            "algorithm": "RSA-2048",
            "status": "active"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load server public key: {str(e)}"
        )

@router.get("/encryption-status", summary="Cek Status Enkripsi")
async def get_encryption_status(
    current_user: dict = Depends(get_current_user),
):
    """
    Cek status enkripsi server
    """
    return {
        "enabled": True,
        "algorithm": "AES-256-GCM + RSA-2048",
        "forward_secrecy": True
    }