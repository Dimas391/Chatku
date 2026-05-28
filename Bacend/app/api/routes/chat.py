import os
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form # type: ignore
from datetime import datetime, timezone
from bson import ObjectId # type: ignore
import logging

from app.core.database import get_collection
from app.middleware.auth import get_current_admin, get_current_user, get_current_user_id
from app.services.chat_service import ChatService
from app.services.media_service import MediaService
from app.services.websocket_manager import manager
from app.services.security_service import SecurityService
from app.models.chat import (
    CreateChatRequest,
    CreateGroupRequest,
    SendMessageRequest,
    MessageType,
    SendEncryptedMessageRequest,
    DualEncryptedMessageRequest,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/chats", tags=["Chat"])
media_svc = MediaService()


# ── Daftar Chat ───────────────────────────────────────────
@router.get("", summary="Daftar Chat Saya")
async def list_chats(
    skip: int = 0,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
):
    chats = await ChatService.get_user_chats(user_id, skip=skip, limit=limit)
    result = []
    for chat in chats:
        unread = await ChatService.get_unread_count(str(chat["_id"]), user_id)
        result.append({
            "id": str(chat["_id"]),
            "type": chat["type"],
            "name": chat.get("name"),
            "avatar_url": chat.get("avatar_url"),
            "participants": chat.get("participants", []),
            "last_message_text": chat.get("last_message_text"),
            "last_message_at": chat.get("last_message_at"),
            "unread_count": unread,
            "created_at": chat["created_at"].isoformat(),
        })
    return {"chats": result, "total": len(result)}


# ── Hapus Chat ────────────────────────────────────────────
@router.delete("/{chat_id}", summary="Hapus/Keluar dari Chat")
async def delete_chat(
    chat_id: str,
    user_id: str = Depends(get_current_user_id),
):
    success = await ChatService.delete_chat(chat_id, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan atau Anda bukan peserta")
    return {"success": True}


# ── Buat / Ambil Personal Chat ────────────────────────────
@router.post("/personal", summary="Buat Personal Chat")
async def create_personal_chat(
    request: CreateChatRequest,
    user_id: str = Depends(get_current_user_id),
):
    chat, is_new = await ChatService.get_or_create_personal_chat(
        user_id=user_id,
        participant_id=request.participant_id,
    )
    return {
        "id": str(chat["_id"]),
        "type": chat["type"],
        "participants": chat["participants"],
        "is_new": is_new,
        "created_at": chat["created_at"].isoformat(),
    }


# ── Buat Grup ─────────────────────────────────────────────
@router.post("/group", summary="Buat Grup Chat")
async def create_group(
    request: CreateGroupRequest,
    user_id: str = Depends(get_current_user_id),
):
    if not request.name.strip():
        raise HTTPException(status_code=400, detail="Nama grup tidak boleh kosong")
    chat = await ChatService.create_group_chat(
        creator_id=user_id,
        name=request.name,
        participant_ids=request.participant_ids,
        description=request.description,
    )
    return {
        "id": str(chat["_id"]),
        "type": chat["type"],
        "name": chat["name"],
        "participants": chat["participants"],
        "created_at": chat["created_at"].isoformat(),
    }


# ── Ambil Pesan (Support Encrypted & Legacy) ──────────────
@router.get("/{chat_id}/messages", summary="Daftar Pesan")
async def get_messages(
    chat_id: str,
    before_id: Optional[str] = None,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
):
    logger.info(f"[API] get_messages called for chat: {chat_id}")
    logger.info(f"[API] User ID: {user_id}")
    logger.info(f"[API] Params: before_id={before_id}, limit={limit}")
    
    try:
        # Verifikasi chat
        chat = await ChatService.get_chat_by_id(chat_id, user_id)
        if not chat:
            logger.warning(f"[API] Chat not found or user not participant: {chat_id}")
            raise HTTPException(status_code=404, detail="Chat tidak ditemukan")
        
        logger.info(f"[API] Chat found: {chat.get('_id')}")
        
        # Ambil messages
        messages = await ChatService.get_messages(
            chat_id=chat_id, 
            user_id=user_id, 
            before_id=before_id, 
            limit=limit
        )
        
        logger.info(f"[API] Retrieved {len(messages)} messages")
        
        return {
            "messages": messages,
            "has_more": len(messages) == limit,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[API] Error in get_messages: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan server: {str(e)}")

@router.get("/admin/list", summary="[ADMIN] Daftar semua chat")
async def admin_list_chats(
    skip: int = 0,
    limit: int = 50,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk mendapatkan daftar semua chat"""
    
    chats_col = get_collection("chats")
    
    total = await chats_col.count_documents({"is_active": True})
    
    cursor = chats_col.find({"is_active": True}).sort("last_message_at", -1).skip(skip).limit(limit)
    chats = await cursor.to_list(length=limit)
    
    result = []
    for chat in chats:
        chat_data = {
            "id": str(chat["_id"]),
            "type": chat.get("type", "personal"),
            "name": chat.get("name"),
            "avatar_url": chat.get("avatar_url"),
            "participants": chat.get("participants", []),
            "last_message_text": chat.get("last_message_text"),
            "last_message_at": chat.get("last_message_at").isoformat() if chat.get("last_message_at") else None,
            "unread_count": 0,  # For admin, we don't track per-admin unread
            "created_at": chat.get("created_at").isoformat() if chat.get("created_at") else None,
        }
        
        # Untuk personal chat, ambil nama peserta lain
        if chat_data["type"] == "personal" and len(chat.get("participants", [])) == 2:
            participants = chat.get("participants", [])
            other_participant_id = None
            for p in participants:
                # Perbaikan: admin token tidak selalu punya sub yang sama dengan participant
                # Kita hanya ingin info user lain
                other_participant_id = p
                break # Ambil yang pertama saja untuk identitas
            
            if other_participant_id:
                other_user = await get_collection("users").find_one(
                    {"_id": ObjectId(other_participant_id)},
                    {"display_name": 1, "avatar_url": 1, "username": 1}
                )
                if other_user:
                    chat_data["participant_name"] = other_user.get("display_name") or other_user.get("username")
                    chat_data["participant_avatar"] = other_user.get("avatar_url")
        
        result.append(chat_data)
    
    return {
        "chats": result,
        "total": total
    }


@router.get("/admin/stats", summary="[ADMIN] Statistik chat")
async def get_chat_stats(admin: dict = Depends(get_current_admin)):
    """Admin endpoint untuk mendapatkan statistik chat"""
    
    total_chats = await get_collection("chats").count_documents({"is_active": True})
    total_messages = await get_collection("messages").count_documents({})
    
    # Chat aktif hari ini (yang punya pesan hari ini)
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    active_chats = await get_collection("messages").distinct("chat_id", {"created_at": {"$gte": today_start}})
    active_today = len(active_chats)
    
    # Personal vs Group
    personal_chats = await get_collection("chats").count_documents({"type": "personal", "is_active": True})
    group_chats = await get_collection("chats").count_documents({"type": "group", "is_active": True})
    
    return {
        "total_chats": total_chats,
        "total_messages": total_messages,
        "active_today": active_today,
        "personal_chats": personal_chats,
        "group_chats": group_chats
    }


@router.get("/admin/participants/{chat_id}", summary="[ADMIN] Daftar peserta chat")
async def get_chat_participants(
    chat_id: str,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk mendapatkan daftar peserta chat"""
    
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="ID chat tidak valid")
    
    chat = await get_collection("chats").find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")
    
    participants = chat.get("participants", [])
    result = []
    
    for pid in participants:
        user = await get_collection("users").find_one(
            {"_id": ObjectId(pid)},
            {"display_name": 1, "username": 1, "avatar_url": 1, "is_online": 1}
        )
        if user:
            result.append({
                "id": str(user["_id"]),
                "name": user.get("display_name") or user.get("username"),
                "avatar_url": user.get("avatar_url"),
                "is_online": user.get("is_online", False)
            })
    
    return {"participants": result}


@router.delete("/admin/delete/{chat_id}", summary="[ADMIN] Hapus chat")
async def admin_delete_chat(
    chat_id: str,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk menghapus chat"""
    
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="ID chat tidak valid")
    
    # Hapus semua pesan dalam chat
    await get_collection("messages").delete_many({"chat_id": chat_id})
    
    # Hapus chat
    result = await get_collection("chats").delete_one({"_id": ObjectId(chat_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")
    
    # Catat ke forensic log
    from app.services.security_service import SecurityService
    await SecurityService.add_forensic_log(
        user_id=str(admin["_id"]),
        event="Chat Deleted by Admin",
        detail=f"Chat {chat_id} has been deleted by admin",
        category="access",
        severity="warning"
    )
    
    return {"success": True, "message": "Chat berhasil dihapus"}


@router.get("/admin/messages/{chat_id}", summary="[ADMIN] Lihat pesan chat")
async def admin_get_chat_messages(
    chat_id: str,
    limit: int = 100,
    admin: dict = Depends(get_current_admin),
):
    """Admin endpoint untuk melihat pesan dalam chat"""
    
    if not ObjectId.is_valid(chat_id):
        raise HTTPException(status_code=400, detail="ID chat tidak valid")
    
    chat = await get_collection("chats").find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")
    
    messages = await get_collection("messages").find(
        {"chat_id": chat_id}
    ).sort("created_at", -1).limit(limit).to_list(length=limit)
    
    # Balik urutan agar dari lama ke baru
    messages.reverse()
    
    result = []
    for msg in messages:
        sender = await get_collection("users").find_one(
            {"_id": ObjectId(msg["sender_id"])},
            {"display_name": 1, "username": 1, "avatar_url": 1}
        )
        
        # Coba decrypt jika ada encrypted_content
        content = msg.get("content")
        if not content and msg.get("encrypted_content_user"):
            content = "[Pesan Terenkripsi]"
        elif not content and msg.get("encrypted_content"):
            content = "[Pesan Terenkripsi (Legacy)]"
        
        result.append({
            "id": str(msg["_id"]),
            "sender_id": msg["sender_id"],
            "sender_name": sender.get("display_name") or sender.get("username") if sender else "Unknown",
            "sender_avatar": sender.get("avatar_url") if sender else None,
            "content": content,
            "type": msg.get("type", "text"),
            "status": msg.get("status", "sent"),
            "classification_label": msg.get("classification_label"),
            "is_destroyed": msg.get("is_destroyed", False),
            "created_at": msg.get("created_at").isoformat() if msg.get("created_at") else None,
        })
    
    return {
        "chat_id": chat_id,
        "chat_name": chat.get("name"),
        "chat_type": chat.get("type"),
        "participants": chat.get("participants", []),
        "messages": result,
        "total": len(result)
    }


# ── Endpoint Lama (DEPRECATED — sudah dihapus) ───────────
@router.post("/{chat_id}/messages/dual-encrypted", summary="[DEPRECATED] Gunakan /messages/encrypted")
async def send_dual_encrypted_message(
    chat_id: str,
    request: DualEncryptedMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Endpoint ini sudah dihapus dalam migrasi ke arsitektur Zero-Knowledge.
    Gunakan POST /{chat_id}/messages/encrypted sebagai gantinya.
    """
    raise HTTPException(
        status_code=410,
        detail=(
            "Endpoint /dual-encrypted sudah tidak digunakan. "
            "Gunakan /messages/encrypted (blind storage). "
            "Klasifikasi dilakukan di sisi client."
        )
    )



# Kirim Pesan Terenkripsi (Legacy) 
@router.post("/{chat_id}/messages/encrypted", summary="Kirim Pesan Terenkripsi (Blind Storage)")
async def send_encrypted_message(
    chat_id: str,
    request: SendEncryptedMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    user_id = str(current_user["_id"])
    chat = await get_collection("chats").find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")
    if user_id not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail="Anda bukan peserta chat")
    
    try:
        logger.info("\n" + "="*60)
        logger.info("[ZERO-KNOWLEDGE] Server menerima pesan terenkripsi dari: %s", user_id)
        logger.info("[LOCK] Ciphertext AES (Isi Pesan) : %s... [TIDAK BISA DIBACA]", request.encrypted_content[:80])
        logger.info("[LOCK] Encrypted AES Key (RSA)    : %s... [TIDAK BISA DI-DECRYPT]", request.encrypted_aes_key[:80])
        logger.info("[LOCK] IV                         : %s", request.iv)
        logger.info("[LOCK] Message Hash (SHA-256)     : %s", request.message_hash)
        logger.info("[LOCK] Label Keamanan (Dari Klien): %s", request.classification_label)
        logger.info("[LOCK] Server HANYA menyimpan data ini dan meneruskannya ke penerima.")
        logger.info("="*60 + "\n")

        result = await ChatService.send_encrypted_message(
            chat_id=chat_id,
            sender_id=user_id,
            encrypted_content=request.encrypted_content,
            encrypted_aes_key=request.encrypted_aes_key,
            encrypted_aes_key_sender=request.encrypted_aes_key_sender,
            iv=request.iv,
            message_hash=request.message_hash,
            reply_to_id=request.reply_to_id,
            classification_label=request.classification_label
        )
        
        # Ambil pesan yang baru saja disimpan untuk di-format dengan benar
        msg_doc = await get_collection("messages").find_one({"_id": ObjectId(result["message_id"])})
        if msg_doc:
            formatted_msg = ChatService.format_message(msg_doc)
            # Pastikan field sender tetap terisi
            formatted_msg["sender_name"] = current_user.get("display_name")
            formatted_msg["sender_avatar"] = current_user.get("avatar_url")
            
            await manager.broadcast_to_chat(
                chat_id=chat_id,
                data={
                    "event": "new_message",
                    "data": formatted_msg
                },
                exclude_user_id=user_id
            )
        
        return {
            "success": True,
            "message_id": result["message_id"],
            "is_verified": result.get("is_verified", True),
        }
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Gagal mengirim pesan")


# ── Kirim Pesan Teks (Legacy - Plain Text) ────────────────
@router.post("/{chat_id}/messages", summary="Kirim Pesan (Legacy)")
async def send_legacy_message(
    chat_id: str,
    request: SendMessageRequest,
    user_id: str = Depends(get_current_user_id),
):
    """
    Kirim pesan plain text (untuk testing)
    """
    chat = await ChatService.get_chat_by_id(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")

    if not request.content:
        raise HTTPException(status_code=400, detail="Konten pesan tidak boleh kosong")

    # Kirim pesan (akan diklasifikasi di server)
    message = await ChatService.send_message(
        chat_id=chat_id,
        sender_id=user_id,
        content=request.content,
        msg_type=request.type,
        reply_to_id=request.reply_to_id,
    )
    formatted = ChatService.format_message(message)

    # Broadcast ke peserta lain via WebSocket
    await manager.notify_new_message(
        chat_id=chat_id, message=formatted, sender_id=user_id
    )

    return formatted


# ── Kirim Media ───────────────────────────────────────────
@router.post("/{chat_id}/messages/media", summary="Kirim Media (Gambar/Video/File)")
async def send_media_message(
    chat_id: str,
    file: UploadFile = File(...),
    reply_to_id: Optional[str] = Form(None),
    user_id: str = Depends(get_current_user_id),
):
    chat = await ChatService.get_chat_by_id(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")

    success, media_url, error = await media_svc.upload_media(
        file=file, folder="chat", user_id=user_id
    )
    if not success:
        raise HTTPException(status_code=400, detail=error or "Upload gagal")

    ct = file.content_type or ""
    if ct.startswith("image/"):
        msg_type = MessageType.IMAGE
    elif ct.startswith("video/"):
        msg_type = MessageType.VIDEO
    elif ct.startswith("audio/"):
        msg_type = MessageType.AUDIO
    else:
        msg_type = MessageType.FILE

    message = await ChatService.send_message(
        chat_id=chat_id,
        sender_id=user_id,
        content=file.filename,
        msg_type=msg_type,
        reply_to_id=reply_to_id,
        media_url=media_url,
    )
    formatted = ChatService.format_message(message)
    
    await manager.notify_new_message(chat_id=chat_id, message=formatted, sender_id=user_id)
    
    return formatted


# ── Tandai Terbaca ────────────────────────────────────────
@router.patch("/{chat_id}/read", summary="Tandai Pesan Sebagai Terbaca")
async def mark_read(
    chat_id: str,
    user_id: str = Depends(get_current_user_id),
):
    count = await ChatService.mark_messages_read(chat_id=chat_id, user_id=user_id)
    if count > 0:
        await manager.notify_messages_read(chat_id=chat_id, reader_id=user_id)
    return {"updated_count": count}


# ── Hapus Pesan ───────────────────────────────────────────
@router.delete(
    "/{chat_id}/messages/{message_id}",
    summary="Hapus Pesan",
)
async def delete_message(
    chat_id: str,
    message_id: str,
    for_everyone: bool = False,
    user_id: str = Depends(get_current_user_id),
):
    success = await ChatService.delete_message(
        message_id=message_id,
        user_id=user_id,
        delete_for_everyone=for_everyone,
    )
    if not success:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")

    if for_everyone:
        await manager.broadcast_to_chat(
            chat_id=chat_id,
            data={"event": "message_deleted", "message_id": message_id, "chat_id": chat_id},
        )
    return {"success": True}


# ── Hash/Hancurkan Konten Pesan ───────────────────────────
@router.post(
    "/{chat_id}/messages/{message_id}/hash",
    summary="Hancurkan/Hash Konten Pesan Berbahaya",
)
async def hash_message(
    chat_id: str,
    message_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Endpoint untuk menghancurkan isi pesan yang dianggap berbahaya.
    Isi pesan akan diganti dengan hash SHA-256.
    """
    success = await ChatService.hash_message_content(message_id, chat_id)
    if not success:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")
    
    # Beritahu chat room bahwa pesan telah di-hash
    await manager.broadcast_to_chat(
        chat_id=chat_id,
        data={
            "event": "message_hashed",
            "message_id": message_id,
            "chat_id": chat_id,
            "classification_label": "Berisiko"
        }
    )
    
    return {"success": True, "message": "Konten pesan berhasil dihancurkan"}





# ── Ambil Pesan ──────────────────────────────────────
@router.get("/{chat_id}/messages/{message_id}", summary="Ambil Pesan")
async def get_message(
    chat_id: str,
    message_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Ambil pesan berdasarkan ID (support dual encrypted & legacy)
    """
    user_id = str(current_user["_id"])
    
    # Verifikasi chat
    chat = await get_collection("chats").find_one({"_id": ObjectId(chat_id)})
    if not chat or user_id not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail="Akses ditolak")
    
    # Ambil pesan
    message = await get_collection("messages").find_one({
        "_id": ObjectId(message_id),
        "chat_id": chat_id
    })
    
    if not message:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")
    
    # Return berdasarkan tipe pesan
    response = {
        "id": str(message["_id"]),
        "chat_id": message["chat_id"],
        "sender_id": message["sender_id"],
        "type": message["type"],
        "classification_label": message.get("classification_label"),
        "is_verified": message.get("is_verified", True),
        "is_destroyed": message.get("is_destroyed", False),
        "created_at": message["created_at"].isoformat()
    }
    
    # Jika dual encrypted (recommended)
    if message.get("encrypted_content_user"):
        response["encrypted_content"] = message["encrypted_content_user"]
        response["encrypted_aes_key"] = message["encrypted_aes_key_user"]
        response["iv"] = message.get("iv")
        response["message_hash"] = message.get("message_hash")
    # Jika legacy encrypted
    elif message.get("encrypted_content"):
        response["encrypted_content"] = message["encrypted_content"]
        response["encrypted_aes_key"] = message.get("encrypted_aes_key")
        response["iv"] = message.get("iv")
        response["message_hash"] = message.get("message_hash")
    # Jika plain text
    else:
        response["content"] = message.get("content")
    
    return response
