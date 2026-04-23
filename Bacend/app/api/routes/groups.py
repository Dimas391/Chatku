from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File # type: ignore
from bson import ObjectId # type: ignore
from datetime import datetime, timezone

from app.middleware.auth import get_current_user, get_current_user_id
from app.core.database import get_collection
from app.services.media_service import MediaService
from app.services.websocket_manager import manager
from app.models.group import GroupUpdateRequest, AddMembersRequest, PromoteAdminRequest

router = APIRouter(prefix="/groups", tags=["Groups"])
media_svc = MediaService()

async def _get_group_and_check_access(
    chat_id: str, user_id: str, require_admin: bool = False
) -> dict:
    """Helper: ambil grup dan verifikasi akses user."""
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="ID chat tidak valid")

    chat = await get_collection("chats").find_one(
        {"_id": ObjectId(chat_id), "type": "group", "is_active": True}
    )
    if not chat:
        raise HTTPException(status_code=404, detail="Grup tidak ditemukan")
    if user_id not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail="Anda bukan anggota grup ini")
    if require_admin and user_id not in chat.get("admins", []):
        raise HTTPException(status_code=403, detail="Hanya admin yang bisa melakukan ini")

    return chat


# ── Info Grup ─────────────────────────────────────────────
@router.get("/{chat_id}", summary="Info Grup")
async def get_group_info(
    chat_id: str,
    user_id: str = Depends(get_current_user_id),
):
    chat = await _get_group_and_check_access(chat_id, user_id)

    # Ambil data member
    member_ids = [ObjectId(uid) for uid in chat.get("participants", []) if ObjectId.is_valid(uid)]
    members_cursor = get_collection("users").find(
        {"_id": {"$in": member_ids}},
        {"_id": 1, "display_name": 1, "avatar_url": 1, "username": 1, "is_online": 1},
    )
    members = await members_cursor.to_list(length=500)

    return {
        "id": str(chat["_id"]),
        "name": chat.get("name"),
        "description": chat.get("description"),
        "avatar_url": chat.get("avatar_url"),
        "admins": chat.get("admins", []),
        "created_by": chat.get("created_by"),
        "member_count": len(chat.get("participants", [])),
        "members": [
            {
                "id": str(m["_id"]),
                "display_name": m.get("display_name"),
                "avatar_url": m.get("avatar_url"),
                "username": m.get("username"),
                "is_online": manager.is_online(str(m["_id"])),
                "is_admin": str(m["_id"]) in chat.get("admins", []),
            }
            for m in members
        ],
        "created_at": chat["created_at"].isoformat(),
    }


# ── Update Info Grup ──────────────────────────────────────
@router.patch("/{chat_id}", summary="Update Info Grup")
async def update_group(
    chat_id: str,
    request: GroupUpdateRequest,
    user_id: str = Depends(get_current_user_id),
):
    chat = await _get_group_and_check_access(chat_id, user_id, require_admin=True)

    update_fields: dict = {"updated_at": datetime.now(timezone.utc)}
    if request.name is not None:
        if not request.name.strip():
            raise HTTPException(status_code=400, detail="Nama grup tidak boleh kosong")
        update_fields["name"] = request.name.strip()
    if request.description is not None:
        update_fields["description"] = request.description[:500]

    await get_collection("chats").update_one(
        {"_id": ObjectId(chat_id)}, {"$set": update_fields}
    )

    # Beritahu semua member via WS
    await manager.broadcast_to_chat(
        chat_id=chat_id,
        data={"event": "group_updated", "chat_id": chat_id, "changes": update_fields},
    )
    return {"success": True, "message": "Grup berhasil diperbarui"}


# ── Upload Foto Grup ──────────────────────────────────────
@router.post("/{chat_id}/avatar", summary="Upload Foto Grup")
async def upload_group_avatar(
    chat_id: str,
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    await _get_group_and_check_access(chat_id, user_id, require_admin=True)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")

    success, url, error = await media_svc.upload_avatar(file=file, user_id=chat_id)
    if not success:
        raise HTTPException(status_code=400, detail=error or "Upload gagal")

    await get_collection("chats").update_one(
        {"_id": ObjectId(chat_id)},
        {"$set": {"avatar_url": url, "updated_at": datetime.now(timezone.utc)}},
    )
    await manager.broadcast_to_chat(
        chat_id=chat_id,
        data={"event": "group_avatar_updated", "chat_id": chat_id, "avatar_url": url},
    )
    return {"avatar_url": url}


# ── Tambah Anggota ────────────────────────────────────────
@router.post("/{chat_id}/members", summary="Tambah Anggota Grup")
async def add_members(
    chat_id: str,
    request: AddMembersRequest,
    user_id: str = Depends(get_current_user_id),
):
    chat = await _get_group_and_check_access(chat_id, user_id, require_admin=True)

    # Filter user yang belum jadi anggota
    existing = set(chat.get("participants", []))
    new_ids = [uid for uid in request.user_ids if uid not in existing]

    if not new_ids:
        raise HTTPException(status_code=400, detail="Semua user sudah menjadi anggota")

    # Validasi user exists
    valid_users = await get_collection("users").find(
        {"_id": {"$in": [ObjectId(uid) for uid in new_ids if ObjectId.is_valid(uid)]}}
    ).to_list(length=50)
    valid_ids = [str(u["_id"]) for u in valid_users]

    await get_collection("chats").update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$addToSet": {"participants": {"$each": valid_ids}},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )

    # Join WS room untuk member baru
    for uid in valid_ids:
        manager.join_chat(uid, chat_id)

    await manager.broadcast_to_chat(
        chat_id=chat_id,
        data={"event": "members_added", "chat_id": chat_id, "added_ids": valid_ids, "by": user_id},
    )
    return {"success": True, "added_count": len(valid_ids), "added_ids": valid_ids}


# ── Keluarkan Anggota ─────────────────────────────────────
@router.delete("/{chat_id}/members/{target_id}", summary="Keluarkan Anggota")
async def remove_member(
    chat_id: str,
    target_id: str,
    user_id: str = Depends(get_current_user_id),
):
    chat = await _get_group_and_check_access(chat_id, user_id, require_admin=True)

    # Admin tidak bisa dikeluarkan oleh admin lain (kecuali created_by)
    if target_id in chat.get("admins", []) and user_id != chat.get("created_by"):
        raise HTTPException(status_code=403, detail="Tidak bisa mengeluarkan admin lain")

    await get_collection("chats").update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$pull": {"participants": target_id, "admins": target_id},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )

    manager.leave_chat(target_id, chat_id)

    # Beritahu yang dikeluarkan
    await manager.send_to_user(
        target_id,
        {"event": "removed_from_group", "chat_id": chat_id, "by": user_id},
    )
    await manager.broadcast_to_chat(
        chat_id=chat_id,
        data={"event": "member_removed", "chat_id": chat_id, "removed_id": target_id},
    )
    return {"success": True}


# ── Keluar dari Grup ──────────────────────────────────────
@router.post("/{chat_id}/leave", summary="Keluar dari Grup")
async def leave_group(
    chat_id: str,
    user_id: str = Depends(get_current_user_id),
):
    chat = await _get_group_and_check_access(chat_id, user_id)

    participants = chat.get("participants", [])
    admins = chat.get("admins", [])

    # Jika creator keluar & sendirian jadi admin, transfer ke member lain
    if user_id == chat.get("created_by") and len(admins) <= 1 and len(participants) > 1:
        other_members = [p for p in participants if p != user_id]
        new_admin = other_members[0]
        await get_collection("chats").update_one(
            {"_id": ObjectId(chat_id)},
            {"$addToSet": {"admins": new_admin}},
        )
        await manager.send_to_user(
            new_admin,
            {"event": "promoted_to_admin", "chat_id": chat_id},
        )

    await get_collection("chats").update_one(
        {"_id": ObjectId(chat_id)},
        {
            "$pull": {"participants": user_id, "admins": user_id},
            "$set": {"updated_at": datetime.now(timezone.utc)},
        },
    )

    manager.leave_chat(user_id, chat_id)
    await manager.broadcast_to_chat(
        chat_id=chat_id,
        data={"event": "member_left", "chat_id": chat_id, "user_id": user_id},
    )
    return {"success": True, "message": "Berhasil keluar dari grup"}


# ── Promosi Admin ─────────────────────────────────────────
@router.post("/{chat_id}/admins", summary="Promosi Anggota Menjadi Admin")
async def promote_admin(
    chat_id: str,
    request: PromoteAdminRequest,
    user_id: str = Depends(get_current_user_id),
):
    chat = await _get_group_and_check_access(chat_id, user_id, require_admin=True)

    if request.user_id not in chat.get("participants", []):
        raise HTTPException(status_code=400, detail="User bukan anggota grup")

    await get_collection("chats").update_one(
        {"_id": ObjectId(chat_id)},
        {"$addToSet": {"admins": request.user_id}},
    )

    await manager.send_to_user(
        request.user_id,
        {"event": "promoted_to_admin", "chat_id": chat_id, "by": user_id},
    )
    return {"success": True, "message": "Anggota dipromosikan menjadi admin"}


# ── Cabut Admin ───────────────────────────────────────────
@router.delete("/{chat_id}/admins/{target_id}", summary="Cabut Hak Admin")
async def demote_admin(
    chat_id: str,
    target_id: str,
    user_id: str = Depends(get_current_user_id),
):
    chat = await _get_group_and_check_access(chat_id, user_id, require_admin=True)

    if target_id == chat.get("created_by"):
        raise HTTPException(status_code=403, detail="Tidak bisa mencabut admin dari pembuat grup")

    await get_collection("chats").update_one(
        {"_id": ObjectId(chat_id)},
        {"$pull": {"admins": target_id}},
    )

    await manager.send_to_user(
        target_id,
        {"event": "demoted_from_admin", "chat_id": chat_id, "by": user_id},
    )
    return {"success": True, "message": "Hak admin berhasil dicabut"}
