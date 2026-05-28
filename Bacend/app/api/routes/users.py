from typing import Optional, List
from winreg import QueryValue
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File # type: ignore
from bson import ObjectId # type: ignore
from datetime import datetime, timezone
from pydantic import BaseModel  # type: ignore
from app.middleware.auth import get_current_admin, get_current_user, get_current_user_id
from app.core.database import get_collection
from app.services.media_service import MediaService
from app.services.websocket_manager import manager
from app.models.user import (
    UpdatePrivacySettingsRequest,
    UserProfileUpdateRequest,
    UpdateNotificationTokenRequest,
)

router = APIRouter(prefix="/users", tags=["Users"])
media_svc = MediaService()


# ── Helper: format user response ──────────────────────────
def _format_user_public(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "username": user.get("username", ""),
        "display_name": user.get("display_name", ""),
        "avatar_url": user.get("avatar_url"),
        "bio": user.get("bio", ""),
        "is_online": manager.is_online(str(user["_id"])),
        "last_seen": user.get("last_seen", datetime.now(timezone.utc)).isoformat(),
        "phone": user.get("phone"),
        "email": user.get("email"),
        "is_verified": user.get("is_verified", False),
        "created_at": user.get("created_at", datetime.now(timezone.utc)).isoformat() if user.get("created_at") else None,
        "message_count": 0,  # Will be calculated if needed
    }


def _format_user_profile(user: dict) -> dict:
    data = _format_user_public(user)
    data.update({
        "phone": user.get("phone"),
        "email": user.get("email"),
        "is_verified": user.get("is_verified", False),
        "created_at": user["created_at"].isoformat(),
    })
    return data


# ── Profil Saya ───────────────────────────────────────────
@router.get("/me", summary="Profil Saya")
async def get_my_profile(current_user: dict = Depends(get_current_user)):
    return _format_user_profile(current_user)


@router.patch("/me", summary="Update Profil")
async def update_profile(
    request: UserProfileUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    users_col = get_collection("users")

    update_fields: dict = {"updated_at": datetime.now(timezone.utc)}

    if request.display_name is not None:
        if not request.display_name.strip():
            raise HTTPException(status_code=400, detail="Nama tidak boleh kosong")
        update_fields["display_name"] = request.display_name.strip()

    if request.bio is not None:
        update_fields["bio"] = request.bio[:200]  # max 200 karakter

    if request.username is not None:
        username = request.username.strip().lower()
        if len(username) < 3:
            raise HTTPException(status_code=400, detail="Username minimal 3 karakter")
        # Cek keunikan username
        existing = await users_col.find_one(
            {"username": username, "_id": {"$ne": ObjectId(user_id)}}
        )
        if existing:
            raise HTTPException(status_code=409, detail="Username sudah digunakan")
        update_fields["username"] = username

    await users_col.update_one(
        {"_id": ObjectId(user_id)}, {"$set": update_fields}
    )
    updated = await users_col.find_one({"_id": ObjectId(user_id)})
    
    # Broadcast profile update via WebSocket
    await manager.notify_profile_updated(user_id, _format_user_public(updated))
    
    return _format_user_profile(updated)

@router.delete("/me/avatar", summary="Hapus Foto Profil")
async def delete_avatar(
    current_user: dict = Depends(get_current_user),
):
    """
    Hapus foto profil user.
    """
    user_id = str(current_user["_id"])
    users_col = get_collection("users")
    
    # Hapus file avatar dari storage jika ada
    current_avatar = current_user.get("avatar_url")
    if current_avatar:
        # Extract filename dari URL
        import os
        filename = current_avatar.split("/")[-1]
        file_path = os.path.join("uploads/avatars", filename)
        if os.path.exists(file_path):
            os.remove(file_path)
    
    # Update database: set avatar_url ke None
    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"avatar_url": None, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Broadcast profile update via WebSocket
    updated = await users_col.find_one({"_id": ObjectId(user_id)})
    await manager.notify_profile_updated(user_id, _format_user_public(updated))
    
    return {"success": True, "message": "Foto profil berhasil dihapus", "avatar_url": None}

@router.get("/me/privacy", summary="Get Privacy Settings")
async def get_privacy_settings(
    current_user: dict = Depends(get_current_user),
):
    """Ambil pengaturan privasi user."""
    privacy = current_user.get("privacy_settings", {})
    return {
        "last_seen": privacy.get("last_seen", "everyone"),
        "profile_photo": privacy.get("profile_photo", "everyone"),
        "status": privacy.get("status", "everyone"),
        "read_receipts": privacy.get("read_receipts", True),
        "typing_indicator": privacy.get("typing_indicator", True),
        "two_factor_auth": privacy.get("two_factor_auth", False),
    }
    
# ── Admin endpoints ────────────────────────────────────────
@router.get("/admin/list", summary="[ADMIN] Daftar semua user")
async def admin_list_users(
    skip: int = 0,
    limit: int = 50,
    search: Optional[str] = None,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk mendapatkan daftar semua user"""
    
    query = {} # Menampilkan semua user (termasuk yang tidak aktif/diblokir)
    
    if search:
        query["$or"] = [
            {"display_name": {"$regex": search, "$options": "i"}},
            {"username": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
        ]
    
    total = await get_collection("users").count_documents(query)
    
    cursor = get_collection("users").find(query).sort("created_at", -1).skip(skip).limit(limit)
    users = await cursor.to_list(length=limit)
    
    # Hitung jumlah pesan per user
    user_ids = [str(u["_id"]) for u in users]
    message_counts = {}
    if user_ids:
        pipeline = [
            {"$match": {"sender_id": {"$in": user_ids}}},
            {"$group": {"_id": "$sender_id", "count": {"$sum": 1}}}
        ]
        counts = await get_collection("messages").aggregate(pipeline).to_list(length=None)
        for c in counts:
            message_counts[c["_id"]] = c["count"]
    
    result = []
    for user in users:
        user_data = _format_user_public(user)
        user_data["message_count"] = message_counts.get(str(user["_id"]), 0)
        user_data["is_active"] = user.get("is_active", True) # Tambahkan status aktif
        result.append(user_data)
    
    return {
        "users": result,
        "total": total,
        "skip": skip,
        "limit": limit
    }


@router.get("/admin/stats", summary="[ADMIN] Statistik pengguna")
async def get_user_stats(admin: dict = Depends(get_current_admin)):
    """Admin endpoint untuk mendapatkan statistik user"""
    
    total = await get_collection("users").count_documents({}) # Hitung semua
    online = len(manager.get_online_user_ids())
    verified = await get_collection("users").count_documents({"is_verified": True})
    blocked = await get_collection("users").count_documents({"is_active": False})
    
    # User dengan RSA key
    encrypted_users = await get_collection("users").count_documents({
        "rsa_public_key": {"$exists": True, "$ne": None}
    })
    
    return {
        "total": total,
        "online": online,
        "offline": max(0, total - online - blocked),
        "verified": verified,
        "blocked": blocked,
        "encrypted_users": encrypted_users
    }


@router.get("/admin/search", summary="Cari Pengguna (Admin)")
async def admin_search_users(
    q: str = Query(..., min_length=1),
    limit: int = 50,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk mencari pengguna"""
    
    query = {
        "$or": [
            {"display_name": {"$regex": q, "$options": "i"}},
            {"username": {"$regex": q, "$options": "i"}},
            {"phone": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}},
        ]
    }
    
    cursor = get_collection("users").find(query).limit(limit)
    users = await cursor.to_list(length=limit)
    
    return {"users": [{**_format_user_public(u), "is_active": u.get("is_active", True)} for u in users]}


@router.get("/admin/detail/{user_id}", summary="[ADMIN] Detail Pengguna")
async def admin_get_user(
    user_id: str,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk mendapatkan detail user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID user tidak valid")
    
    user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    # Hitung jumlah pesan
    message_count = await get_collection("messages").count_documents({"sender_id": user_id})
    
    # Hitung jumlah chat
    chat_count = await get_collection("chats").count_documents({"participants": user_id})
    
    user_data = _format_user_public(user)
    user_data["message_count"] = message_count
    user_data["chat_count"] = chat_count
    user_data["is_active"] = user.get("is_active", True)
    
    return user_data


@router.post("/admin/block/{user_id}", summary="[ADMIN] Blokir User")
async def admin_block_user(
    user_id: str,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk memblokir user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID user tidak valid")
    
    user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": False, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Catat ke forensic log
    from app.services.security_service import SecurityService
    await SecurityService.add_forensic_log(
        user_id=user_id,
        event="User Blocked by Admin",
        detail=f"User {user_id} has been blocked by admin {admin.get('username')}",
        category="access",
        severity="warning"
    )
    
    return {"success": True, "message": f"User {user.get('display_name', user_id)} telah diblokir"}


@router.post("/admin/unblock/{user_id}", summary="[ADMIN] Buka Blokir User")
async def admin_unblock_user(
    user_id: str,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk membuka blokir user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID user tidak valid")
    
    user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_active": True, "updated_at": datetime.now(timezone.utc)}}
    )
    
    # Catat ke forensic log
    from app.services.security_service import SecurityService
    await SecurityService.add_forensic_log(
        user_id=user_id,
        event="User Unblocked by Admin",
        detail=f"User {user_id} has been unblocked by admin {admin.get('username')}",
        category="access",
        severity="info"
    )
    
    return {"success": True, "message": f"User {user.get('display_name', user_id)} telah diaktifkan kembali"}


@router.delete("/admin/delete/{user_id}", summary="[ADMIN] Hapus User")
async def admin_delete_user(
    user_id: str,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk menghapus user"""
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID user tidak valid")
    
    user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    
    # Hapus data terkait
    await get_collection("messages").delete_many({"sender_id": user_id})
    await get_collection("chats").update_many(
        {"participants": user_id},
        {"$pull": {"participants": user_id}}
    )
    await get_collection("users").delete_one({"_id": ObjectId(user_id)})
    
    # Catat ke forensic log
    from app.services.security_service import SecurityService
    await SecurityService.add_forensic_log(
        user_id=admin.get("_id", "admin"),
        event="User Deleted by Admin",
        detail=f"User {user_id} ({user.get('display_name', 'Unknown')}) has been deleted by admin",
        category="access",
        severity="critical"
    )
    
    return {"success": True, "message": f"User {user.get('display_name', user_id)} telah dihapus"}


    
@router.put("/me/notification-token")
async def update_notification_token(
    request: dict,
    user_id: str = Depends(get_current_user_id),
):
    """Update Expo push token untuk notifikasi."""
    token = request.get("token")
    platform = request.get("platform", "unknown")
    device_id = request.get("device_id")
    
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "expo_push_token": token,
                "notification_platform": platform,
                "notification_device_id": device_id,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    return {"success": True}

class UpdateNotificationSettingsRequest(BaseModel):
    messages: Optional[bool] = None
    calls: Optional[bool] = None
    groups: Optional[bool] = None

@router.get("/me/notification-settings", summary="Get Notification Settings")
async def get_notification_settings(
    current_user: dict = Depends(get_current_user),
):
    """Ambil pengaturan notifikasi user."""
    settings = current_user.get("notification_settings", {
        "messages": True,
        "calls": True,
        "groups": False,
    })
    return settings

@router.patch("/me/notification-settings", summary="Update Notification Settings")
async def update_notification_settings(
    request: UpdateNotificationSettingsRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update pengaturan notifikasi user."""
    user_id = str(current_user["_id"])
    users_col = get_collection("users")
    
    notification_settings = current_user.get("notification_settings", {})
    
    if request.messages is not None:
        notification_settings["messages"] = request.messages
    if request.calls is not None:
        notification_settings["calls"] = request.calls
    if request.groups is not None:
        notification_settings["groups"] = request.groups
    
    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"notification_settings": notification_settings, "updated_at": datetime.now(timezone.utc)}}
    )
    
    return {"success": True, "data": notification_settings}

@router.get("/{user_id}/public-key", summary="Ambil Public Key User")
async def get_user_public_key(
    user_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Ambil public key RSA user lain untuk enkripsi end-to-end.
    Auto-convert PKCS#1 → SPKI agar kompatibel dengan Android.
    """
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID user tidak valid")

    user = await get_collection("users").find_one(
        {"_id": ObjectId(user_id), "is_active": True},
        {"rsa_public_key": 1}
    )

    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    public_key = user.get("rsa_public_key")
    if not public_key:
        raise HTTPException(status_code=404, detail="User belum memiliki public key")

    # Normalisasi ke SPKI (BEGIN PUBLIC KEY) agar RSA.encrypt() Android tidak crash
    from app.utils.key_utils import normalize_public_key
    converted = normalize_public_key(public_key)

    # Simpan hasil konversi ke DB agar tidak perlu konversi ulang
    if converted != public_key:
        await get_collection("users").update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"rsa_public_key": converted}}
        )
        print(f"[KEY] Updated PKCS#1→SPKI in DB for user {user_id}")

    return {"public_key": converted}

class PublicKeyRequest(BaseModel):
    public_key: str

@router.post("/me/public-key", summary="Simpan Public Key User")
async def save_user_public_key(
    request: PublicKeyRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Simpan public key RSA user ke database.
    Auto-convert PKCS#1 (BEGIN RSA PUBLIC KEY) ke SPKI (BEGIN PUBLIC KEY)
    agar kompatibel dengan semua platform (Android/iOS/Web).
    """
    user_id = str(current_user["_id"])
    users_col = get_collection("users")

    from app.utils.key_utils import normalize_public_key
    public_key = normalize_public_key(request.public_key)

    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"rsa_public_key": public_key, "updated_at": datetime.now(timezone.utc)}}
    )

    key_format = "SPKI" if "BEGIN PUBLIC KEY" in public_key and "RSA" not in public_key else "PKCS#1"
    return {"success": True, "message": "Public key berhasil disimpan", "format": key_format}


@router.patch("/me/privacy", summary="Update Privacy Settings")
async def update_privacy_settings(
    request: UpdatePrivacySettingsRequest,
    current_user: dict = Depends(get_current_user),
):
    """Update pengaturan privasi user."""
    user_id = str(current_user["_id"])
    users_col = get_collection("users")
    
    update_fields = {}
    privacy_settings = current_user.get("privacy_settings", {})
    
    if request.last_seen is not None:
        privacy_settings["last_seen"] = request.last_seen
    if request.profile_photo is not None:
        privacy_settings["profile_photo"] = request.profile_photo
    if request.status is not None:
        privacy_settings["status"] = request.status
    if request.read_receipts is not None:
        privacy_settings["read_receipts"] = request.read_receipts
    if request.typing_indicator is not None:
        privacy_settings["typing_indicator"] = request.typing_indicator
    if request.two_factor_auth is not None:
        privacy_settings["two_factor_auth"] = request.two_factor_auth
    
    update_fields["privacy_settings"] = privacy_settings
    update_fields["updated_at"] = datetime.now(timezone.utc)
    
    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": update_fields}
    )
    
    return {
        "success": True,
        "message": "Pengaturan privasi berhasil diperbarui",
        "data": privacy_settings
    }


@router.get("/me/devices", summary="Get Active Devices")
async def get_active_devices(
):
    """Ambil daftar perangkat aktif user."""
    # Untuk sementara return device saat ini
    devices = [
        {
            "id": "current_device",
            "name": "Smartphone - Android",
            "location": "Sekarang ini • Jakarta, Indonesia",
            "is_current": True,
            "last_active": datetime.now(timezone.utc).isoformat()
        }
    ]
    return {"devices": devices}


@router.delete("/me/devices/{device_id}", summary="Remove Device")
async def remove_device(
   
):
    """Hapus perangkat yang terhubung."""
    # Implementasi hapus device
    return {"success": True, "message": "Perangkat berhasil dihapus"}


@router.post("/me/clear-chat-history", summary="Clear Chat History")
async def clear_chat_history(
    current_user: dict = Depends(get_current_user),
):
    """Hapus semua riwayat chat user."""
    user_id = str(current_user["_id"])
    
    # Hapus semua pesan yang dikirim atau diterima user
    messages_col = get_collection("messages")
    chats_col = get_collection("chats")
    
    # Cari semua chat user
    user_chats = await chats_col.find({"participants": user_id}).to_list(length=None)
    chat_ids = [str(chat["_id"]) for chat in user_chats]
    
    # Hapus pesan dari chat tersebut
    if chat_ids:
        await messages_col.delete_many({"chat_id": {"$in": chat_ids}})
    
    # Hapus chat
    await chats_col.delete_many({"participants": user_id})
    
    return {"success": True, "message": "Riwayat chat berhasil dihapus"}


@router.post("/me/delete-account", summary="Delete Account")
async def delete_account(
    current_user: dict = Depends(get_current_user),
):
    """Hapus akun user secara permanen."""
    user_id = str(current_user["_id"])
    users_col = get_collection("users")
    
    # Soft delete - set inactive
    await users_col.update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "is_active": False,
                "is_verified": False,
                "updated_at": datetime.now(timezone.utc)
            }
        }
    )
    
    return {"success": True, "message": "Akun berhasil dihapus"}


@router.post("/me/avatar", summary="Upload Foto Profil")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")

    success, url, error = await media_svc.upload_avatar(file=file, user_id=user_id)
    if not success:
        raise HTTPException(status_code=400, detail=error or "Upload gagal")

    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"avatar_url": url, "updated_at": datetime.now(timezone.utc)}},
    )
    
    # Broadcast profile update via WebSocket
    updated = await get_collection("users").find_one({"_id": ObjectId(user_id)})
    await manager.notify_profile_updated(user_id, _format_user_public(updated))
    
    return {"avatar_url": url}


@router.put("/me/notification-token", summary="Simpan FCM/APNs Token")
async def update_notification_token(
    request: UpdateNotificationTokenRequest,
    user_id: str = Depends(get_current_user_id),
):
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {
            "$set": {
                "notification_token": request.token,
                "updated_at": datetime.now(timezone.utc),
            }
        },
    )
    return {"success": True}


# ── Cari User ─────────────────────────────────────────────
@router.get("/search", summary="Cari Pengguna")
async def search_users(
    q: str,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
):
    if len(q.strip()) < 2:
        raise HTTPException(status_code=400, detail="Kata pencarian minimal 2 karakter")

    cursor = get_collection("users").find(
        {
            "_id": {"$ne": ObjectId(user_id)},
            "is_active": True,
            "$or": [
                {"username": {"$regex": q, "$options": "i"}},
                {"display_name": {"$regex": q, "$options": "i"}},
                {"phone": {"$regex": q, "$options": "i"}},
            ],
        }
    ).limit(limit)

    users = await cursor.to_list(length=limit)
    return {"users": [_format_user_public(u) for u in users]}


# ── Profil User Lain ──────────────────────────────────────
@router.get("/contacts", summary="Daftar Kontak Saya")
async def get_contacts(current_user: dict = Depends(get_current_user)):
    contact_ids = current_user.get("contacts", [])
    if not contact_ids:
        return {"contacts": []}

    obj_ids = [ObjectId(cid) for cid in contact_ids if ObjectId.is_valid(cid)]
    cursor = get_collection("users").find(
        {"_id": {"$in": obj_ids}, "is_active": True}
    )
    users = await cursor.to_list(length=500)
    return {"contacts": [_format_user_public(u) for u in users]}


@router.get("/{user_id}", summary="Profil Pengguna")
async def get_user_profile(
    user_id: str,
    _: str = Depends(get_current_user_id),
):
    if not ObjectId.is_valid(user_id):
        raise HTTPException(status_code=400, detail="ID user tidak valid")

    user = await get_collection("users").find_one(
        {"_id": ObjectId(user_id), "is_active": True}
    )
    if not user:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    return _format_user_public(user)


# ── Kontak ────────────────────────────────────────────────
@router.post("/{target_id}/contact", summary="Tambah Kontak")
async def add_contact(
    target_id: str,
    user_id: str = Depends(get_current_user_id),
):
    if target_id == user_id:
        raise HTTPException(status_code=400, detail="Tidak bisa menambah diri sendiri")
    if not ObjectId.is_valid(target_id):
        raise HTTPException(status_code=400, detail="ID user tidak valid")

    target = await get_collection("users").find_one({"_id": ObjectId(target_id)})
    if not target:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")

    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"contacts": target_id}},
    )
    return {"success": True, "message": "Kontak ditambahkan"}


@router.delete("/{target_id}/contact", summary="Hapus Kontak")
async def remove_contact(
    target_id: str,
    user_id: str = Depends(get_current_user_id),
):
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"contacts": target_id}},
    )
    return {"success": True, "message": "Kontak dihapus"}


# ── Blokir ────────────────────────────────────────────────
@router.post("/{target_id}/block", summary="Blokir User")
async def block_user(
    target_id: str,
    user_id: str = Depends(get_current_user_id),
):
    if target_id == user_id:
        raise HTTPException(status_code=400, detail="Tidak bisa blokir diri sendiri")

    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {"$addToSet": {"blocked_users": target_id}},
    )
    return {"success": True, "message": "User diblokir"}


@router.delete("/{target_id}/block", summary="Buka Blokir User")
async def unblock_user(
    target_id: str,
    user_id: str = Depends(get_current_user_id),
):
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"blocked_users": target_id}},
    )
    return {"success": True, "message": "Blokir dibuka"}