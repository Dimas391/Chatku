from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File # type: ignore
from bson import ObjectId # type: ignore
from datetime import datetime, timezone
from pydantic import BaseModel  # type: ignore
from app.middleware.auth import get_current_user, get_current_user_id
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