import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from bson import ObjectId
from datetime import datetime, timezone

from app.middleware.auth import get_current_user
from app.core.database import get_collection
from app.services.websocket_manager import manager
from pydantic import BaseModel

router = APIRouter(prefix="/contacts", tags=["Contacts"])
logger = logging.getLogger(__name__)


# ─── Models ──────────────────────────────────────────────────────────────
class ContactRequest(BaseModel):
    """Request untuk menambah kontak"""
    user_id: str

    class Config:
        json_schema_extra = {
            "example": {"user_id": "67a1b2c3d4e5f67890abcdef"}
        }

class ContactResponse(BaseModel):
    """Response untuk data kontak"""
    id: str
    user_id: str
    name: str
    display_name: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_online: bool = False
    last_seen: Optional[str] = None
    is_verified: bool = False
    mutual_friends: int = 0
    added_at: str

class ContactSearchResponse(BaseModel):
    """Response untuk pencarian user"""
    id: str
    name: str
    display_name: str
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    is_online: bool = False
    is_verified: bool = False
    is_contact: bool = False

# ─── Helper Functions ────────────────────────────────────────────────────
def format_contact(user: dict, current_user_id: str, added_at: str = None) -> ContactResponse:
    """Format user menjadi response kontak"""
    return ContactResponse(
        id=str(user["_id"]),
        user_id=str(user["_id"]),
        name=user.get("display_name") or user.get("username") or "Pengguna",
        display_name=user.get("display_name") or user.get("username") or "Pengguna",
        avatar_url=user.get("avatar_url"),
        phone=user.get("phone"),
        email=user.get("email"),
        is_online=manager.is_online(str(user["_id"])),
        last_seen=user.get("last_seen").isoformat() if user.get("last_seen") else None,
        is_verified=user.get("is_verified", False),
        mutual_friends=0,  # TODO: Hitung mutual friends
        added_at=added_at or datetime.now(timezone.utc).isoformat()
    )


def format_search_user(user: dict, is_contact: bool = False) -> ContactSearchResponse:
    """Format user untuk response pencarian"""
    return ContactSearchResponse(
        id=str(user["_id"]),
        name=user.get("display_name") or user.get("username") or "Pengguna",
        display_name=user.get("display_name") or user.get("username") or "Pengguna",
        avatar_url=user.get("avatar_url"),
        phone=user.get("phone"),
        email=user.get("email"),
        is_online=manager.is_online(str(user["_id"])),
        is_verified=user.get("is_verified", False),
        is_contact=is_contact
    )


# ─── Endpoints ───────────────────────────────────────────────────────────
@router.get("/", response_model=List[ContactResponse])
async def get_contacts(
    current_user: dict = Depends(get_current_user),
):
    """
    Ambil daftar semua kontak user yang sedang login.
    """
    user_id = str(current_user["_id"])
    contact_ids = current_user.get("contacts", [])
    
    if not contact_ids:
        return []
    
    # Validasi ObjectId
    valid_ids = [ObjectId(cid) for cid in contact_ids if ObjectId.is_valid(cid)]
    if not valid_ids:
        return []
    
    # Ambil data user kontak
    cursor = get_collection("users").find(
        {"_id": {"$in": valid_ids}, "is_active": True}
    )
    users = await cursor.to_list(length=100)
    
    # Format response
    contacts = []
    for user in users:
        added_at = None
        # Cari waktu ditambahkan dari contacts list (bisa disimpan di array of objects)
        contacts.append(format_contact(user, user_id))
    
    # Urutkan berdasarkan nama
    contacts.sort(key=lambda x: x.name.lower())
    
    return contacts


@router.get("/search", response_model=List[ContactSearchResponse])
async def search_users(
    q: str = Query(..., min_length=2, description="Kata kunci pencarian"),
    limit: int = Query(20, ge=1, le=50),
    current_user: dict = Depends(get_current_user),
):
    """
    Cari user berdasarkan nama, username, atau nomor telepon.
    """
    user_id = str(current_user["_id"])
    contact_ids = set(current_user.get("contacts", []))
    
    # Cari user yang match
    cursor = get_collection("users").find(
        {
            "_id": {"$ne": ObjectId(user_id)},
            "is_active": True,
            "$or": [
                {"display_name": {"$regex": q, "$options": "i"}},
                {"username": {"$regex": q, "$options": "i"}},
                {"phone": {"$regex": q, "$options": "i"}},
                {"email": {"$regex": q, "$options": "i"}},
            ]
        }
    ).limit(limit)
    
    users = await cursor.to_list(length=limit)
    
    # Format response
    results = []
    for user in users:
        is_contact = str(user["_id"]) in contact_ids
        results.append(format_search_user(user, is_contact))
    
    return results


@router.post("/add", status_code=status.HTTP_201_CREATED)
async def add_contact(
    request: ContactRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Tambahkan user ke daftar kontak.
    """
    user_id = str(current_user["_id"])
    target_id = request.user_id
    
    if target_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak bisa menambahkan diri sendiri sebagai kontak"
        )
    
    if not ObjectId.is_valid(target_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID user tidak valid"
        )
    
    # Cek apakah target user ada
    target_user = await get_collection("users").find_one(
        {"_id": ObjectId(target_id), "is_active": True}
    )
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan"
        )
    
    # Cek apakah sudah menjadi kontak
    current_contacts = current_user.get("contacts", [])
    if target_id in current_contacts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User sudah ada dalam daftar kontak"
        )
    
    # Tambahkan ke daftar kontak
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {
            "$addToSet": {"contacts": target_id},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    # Kirim notifikasi via WebSocket jika target online
    await manager.send_to_user(
        target_id,
        {
            "event": "contact_added",
            "data": {
                "user_id": user_id,
                "user_name": current_user.get("display_name") or current_user.get("username"),
                "user_avatar": current_user.get("avatar_url")
            }
        }
    )
    
    return {
        "success": True,
        "message": "Kontak berhasil ditambahkan",
        "contact": format_contact(target_user, user_id)
    }
    
@router.get("/from-chats", response_model=List[ContactResponse])
async def get_contacts_from_chats(
    current_user: dict = Depends(get_current_user),
):
    """
    Ambil daftar kontak dari riwayat chat user.
    Menampilkan semua user yang pernah diajak chat.
    """
    user_id = str(current_user["_id"])
    
    # Ambil semua chat user
    chats_col = get_collection("chats")
    chats = await chats_col.find({"participants": user_id}).to_list(length=100)
    
    if not chats:
        return []
    
    # Kumpulkan semua participant IDs (kecuali user sendiri)
    contact_ids = set()
    for chat in chats:
        participants = chat.get("participants", [])
        for pid in participants:
            if pid != user_id:
                contact_ids.add(pid)
    
    if not contact_ids:
        return []
    
    # Ambil data user kontak
    valid_ids = [ObjectId(cid) for cid in contact_ids if ObjectId.is_valid(cid)]
    cursor = get_collection("users").find(
        {"_id": {"$in": valid_ids}, "is_active": True}
    )
    users = await cursor.to_list(length=100)
    
    # Format response
    contacts = []
    for user in users:
        contacts.append(format_contact(user, user_id))
    
    # Urutkan berdasarkan nama
    contacts.sort(key=lambda x: x.name.lower())
    
    return contacts

@router.delete("/{contact_id}")
async def remove_contact(
    contact_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Hapus user dari daftar kontak.
    """
    user_id = str(current_user["_id"])
    
    if not ObjectId.is_valid(contact_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="ID user tidak valid"
        )
    
    # Cek apakah kontak ada
    current_contacts = current_user.get("contacts", [])
    if contact_id not in current_contacts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Kontak tidak ditemukan"
        )
    
    # Hapus dari daftar kontak
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {
            "$pull": {"contacts": contact_id},
            "$set": {"updated_at": datetime.now(timezone.utc)}
        }
    )
    
    return {
        "success": True,
        "message": "Kontak berhasil dihapus"
    }


@router.get("/requests", response_model=List[dict])
async def get_contact_requests(
    current_user: dict = Depends(get_current_user),
):
    """
    Ambil daftar permintaan kontak (untuk fitur request contact - optional).
    """
    # TODO: Implement contact request feature
    return []


@router.post("/requests/accept/{request_id}")
async def accept_contact_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Terima permintaan kontak.
    """
    # TODO: Implement accept contact request
    return {"success": True, "message": "Permintaan kontak diterima"}


@router.post("/requests/decline/{request_id}")
async def decline_contact_request(
    request_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Tolak permintaan kontak.
    """
    # TODO: Implement decline contact request
    return {"success": True, "message": "Permintaan kontak ditolak"}