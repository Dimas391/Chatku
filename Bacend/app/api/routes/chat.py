# app/api/routes/chat.py
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from datetime import datetime

from app.middleware.auth import get_current_user, get_current_user_id
from app.services.chat_service import ChatService
from app.services.media_service import MediaService
from app.services.websocket_manager import manager
from app.models.chat import (
    CreateChatRequest,
    CreateGroupRequest,
    SendMessageRequest,
    MessageType,
)

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


# ── Ambil Pesan ───────────────────────────────────────────
@router.get("/{chat_id}/messages", summary="Daftar Pesan")
async def get_messages(
    chat_id: str,
    before_id: Optional[str] = None,
    limit: int = 50,
    user_id: str = Depends(get_current_user_id),
):
    chat = await ChatService.get_chat_by_id(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")

    messages = await ChatService.get_messages(
        chat_id=chat_id, user_id=user_id, before_id=before_id, limit=limit
    )
    return {
        "messages": [ChatService.format_message(m) for m in messages],
        "has_more": len(messages) == limit,
    }


# ── Kirim Pesan Teks ──────────────────────────────────────
@router.post("/{chat_id}/messages", summary="Kirim Pesan")
async def send_message(
    chat_id: str,
    request: SendMessageRequest,
    user_id: str = Depends(get_current_user_id),
):
    
    chat = await ChatService.get_chat_by_id(chat_id, user_id)
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")

    if not request.content and request.type == MessageType.TEXT:
        raise HTTPException(status_code=400, detail="Konten pesan tidak boleh kosong")

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