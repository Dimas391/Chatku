from fastapi import APIRouter, Depends, HTTPException, status # type: ignore
from datetime import datetime, timezone, timedelta
from bson import ObjectId # type: ignore

from app.core.database import get_collection
from app.core.security import create_access_token, create_refresh_token
from app.models.admin import AdminLoginRequest, AdminLoginResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/login", response_model=AdminLoginResponse)
async def admin_login(request: AdminLoginRequest):
    """Login untuk admin panel"""
    
    # Cari admin di database
    admin = await get_collection("admins").find_one({
        "username": request.username,
        "is_active": True
    })
    
    if not admin:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah"
        )
    
    # Verifikasi password (gunakan bcrypt di production)
    # Untuk sementara, gunakan perbandingan langsung
    # TODO: Implement bcrypt
    if admin.get("password") != request.password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah"
        )
    
    # Update last login
    await get_collection("admins").update_one(
        {"_id": admin["_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc)}}
    )
    
    # Buat tokens
    admin_id = str(admin["_id"])
    access_token = create_access_token(
        subject=admin_id,
        extra_data={"role": admin.get("role", "admin"), "is_admin": True}
    )
    refresh_token = create_refresh_token(subject=admin_id)
    
    return AdminLoginResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        admin={
            "id": admin_id,
            "username": admin["username"],
            "name": admin.get("name", ""),
            "role": admin.get("role", "Administrator")
        }
    )


@router.get("/verify")
async def verify_admin_token(token: str):
    """Verifikasi token admin"""
    from app.core.security import decode_token
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    
    if not payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Bukan akses admin")
    
    admin_id = payload.get("sub")
    admin = await get_collection("admins").find_one({"_id": ObjectId(admin_id)})
    
    if not admin:
        raise HTTPException(status_code=404, detail="Admin tidak ditemukan")
    
    return {
        "valid": True,
        "admin": {
            "id": str(admin["_id"]),
            "username": admin["username"],
            "name": admin.get("name", ""),
            "role": admin.get("role", "")
        }
    }


@router.post("/seed")
async def seed_admin():
    """Seeder untuk membuat admin default (hanya untuk development)"""
    
    # Cek apakah sudah ada admin
    existing = await get_collection("admins").find_one({"username": "admin"})
    if existing:
        return {"message": "Admin already exists"}
    
    # Buat admin default
    await get_collection("admins").insert_one({
        "username": "admin",
        "password": "chatku2024",  # TODO: hash dengan bcrypt
        "name": "Super Administrator",
        "role": "Administrator",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })
    
    await get_collection("admins").insert_one({
        "username": "dimas",
        "password": "dimas123",
        "name": "Dimas Kurniawan",
        "role": "Moderator",
        "is_active": True,
        "created_at": datetime.now(timezone.utc)
    })
    
    return {"message": "Admin accounts created"}