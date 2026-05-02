import os
import base64
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form # type: ignore
from datetime import datetime, timezone
from bson import ObjectId # type: ignore
import logging

from app.core.database import get_collection
from app.middleware.auth import get_current_user, get_current_user_id
from app.services.chat_service import ChatService
from app.services.media_service import MediaService
from app.services.websocket_manager import manager
from app.services.classification_service import ClassificationService, classification_service
from app.services.encryption_service import encryption_service
from app.services.security_service import SecurityService
from app.models.chat import (
    CreateChatRequest,
    CreateGroupRequest,
    SendMessageRequest,
    MessageType,
    SendEncryptedMessageRequest,
    DualEncryptedMessageRequest,
    MessageDocument,
    MessageStatus,
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


# ── Kirim Pesan Dual Encrypted (RECOMMENDED) ──────────────
@router.post("/{chat_id}/messages/dual-encrypted", summary="Kirim Pesan Dual Encrypted")
async def send_dual_encrypted_message(
    chat_id: str,
    request: DualEncryptedMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Menerima pesan dual-encrypted.
    - Server decrypt dengan server key untuk klasifikasi
    - Server TIDAK bisa decrypt user key (end-to-end)
    """
    user_id = str(current_user["_id"])
    
    # Gunakan field yang benar dari request
    encrypted_content_user = request.encrypted_content_user
    encrypted_content_server = request.encrypted_content_server
    encrypted_aes_key_user = request.encrypted_aes_key_user
    encrypted_aes_key_server = request.encrypted_aes_key_server
    iv = request.iv
    message_hash = request.message_hash
    reply_to_id = request.reply_to_id
    
    print(f"[DUAL] Received dual encrypted message for chat: {chat_id}")
    print(f"[DUAL] encrypted_content_user length: {len(encrypted_content_user) if encrypted_content_user else 0}")
    print(f"[DUAL] encrypted_content_server length: {len(encrypted_content_server) if encrypted_content_server else 0}")
    print(f"[DUAL] encrypted_aes_key_user length: {len(encrypted_aes_key_user) if encrypted_aes_key_user else 0}")
    print(f"[DUAL] encrypted_aes_key_server length: {len(encrypted_aes_key_server) if encrypted_aes_key_server else 0}")
    print(f"[DUAL] IV length: {len(iv) if iv else 0}")
    print(f"[DUAL] Message hash: {message_hash[:20] if message_hash else 'None'}...")
    
    # Verifikasi chat
    chat = await get_collection("chats").find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")
    
    if user_id not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail="Anda bukan peserta chat")
    
    classification_label = "Tidak Berisiko"
    confidence = 0.5
    is_verified = True
    is_destroyed = False
    
    try:
        # SERVER DECRYPT untuk klasifikasi
        print("[DUAL] Server decrypting with server key...")
        
        # Decrypt server key (server punya private key sendiri)
        server_key = encryption_service.decrypt_aes_key(encrypted_aes_key_server)
        
        # Jika server_key hasil dekripsi RSA adalah string base64 (panjang ~44 untuk AES-256), 
        # kita harus decode ke bytes mentah (32 bytes)
        if len(server_key) != 32:
            try:
                print(f"[DUAL] Server key is not 32 bytes ({len(server_key)} bytes), attempting base64 decode...")
                server_key = base64.b64decode(server_key)
            except Exception as e:
                print(f"[DUAL] Failed to decode server key from base64: {e}")
                
        print(f"[DUAL] Server key ready, length: {len(server_key)} bytes")
        
        # Decrypt message for classification
        plaintext = encryption_service.decrypt_message(
            encrypted_content_server, 
            server_key, 
            iv
        )
        
        print(f"[DUAL] Plaintext for classification: {plaintext[:50]}...")
        print(f"[DUAL] Plaintext length: {len(plaintext)} chars")
        
        # Verify hash
        is_verified = encryption_service.verify_message_hash(plaintext, message_hash)
        print(f"[DUAL] Hash verification: {is_verified}")
        
        # KLASIFIKASI
        print("[DUAL] Classifying message...")
        classification_label, confidence = classification_service.classify(plaintext)
        
        print(f"[DUAL] Classification: {classification_label} ({confidence:.2%})")
        
        # Check if message is dangerous
        is_destroyed = classification_label == "Berisiko"
        if is_destroyed:
            print("[DUAL] Dangerous content detected! Message will be destroyed.")
            # Catat ke forensic log
            await SecurityService.add_forensic_log(
                user_id=user_id,
                event="Dangerous Content Detected",
                detail=f"Sistem mendeteksi konten berbahaya dalam pesan terenkripsi di chat {chat_id}",
                category="integrity",
                severity="critical"
            )
        
        # HAPUS PLAINTEXT DARI MEMORI
        encryption_service.clear_memory(plaintext, server_key)
        print("[DUAL] Plaintext cleared from memory")
        
    except Exception as e:
        print(f"[DUAL] Classification error: {e}")
        import traceback
        traceback.print_exc()
        # Tetap simpan pesan meskipun klasifikasi gagal
    
    try:
        # SIMPAN ke database (hanya user ciphertext)
        print("[DUAL] Saving message to database...")
        
        message_doc = MessageDocument(
            chat_id=chat_id,
            sender_id=user_id,
            type=MessageType.TEXT,
            encrypted_content_user=encrypted_content_user,
            encrypted_aes_key_user=encrypted_aes_key_user,
            encrypted_aes_key_sender=request.encrypted_aes_key_sender,
            encrypted_content_server=encrypted_content_server,
            encrypted_aes_key_server=encrypted_aes_key_server,
            iv=iv,
            message_hash=message_hash,
            classification_label=classification_label,
            classification_confidence=confidence,
            is_verified=is_verified,
            is_destroyed=is_destroyed,
            reply_to_id=reply_to_id,
            status=MessageStatus.SENT,
        )
        
        messages_col = get_collection("messages")
        result = await messages_col.insert_one(
            message_doc.model_dump(by_alias=True, exclude={"id"})
        )
        
        message_id = str(result.inserted_id)
        print(f"[DUAL] Message saved. ID: {message_id}")
        
        # ✅ Update last message preview di chat room
        if is_destroyed:
            preview = "⚠️ Pesan berbahaya telah diblokir oleh sistem"
        else:
            preview = "[Pesan terenkripsi]"
            
        await get_collection("chats").update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$set": {
                    "last_message_id": message_id,
                    "last_message_text": preview,
                    "last_message_at": datetime.now(timezone.utc),
                    "last_message_by": user_id,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        
        #  BROADCAST ke participant lain (hanya user ciphertext)
        print(" [DUAL] Broadcasting to chat participants...")
        await manager.broadcast_to_chat(
            chat_id=chat_id,
            data={
                "event": "new_message",
                "data": {
                    "id": message_id,
                    "chat_id": chat_id,
                    "sender_id": user_id,
                    "sender_name": current_user.get("display_name"),
                    "sender_avatar": current_user.get("avatar_url"),
                    "encrypted_content": encrypted_content_user,
                    "encrypted_aes_key": encrypted_aes_key_user,
                    "encrypted_aes_key_sender": request.encrypted_aes_key_sender,
                    "iv": iv,
                    "message_hash": message_hash,
                    "classification_label": classification_label,
                    "is_destroyed": is_destroyed,
                    "is_verified": is_verified,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            },
            exclude_user_id=user_id
        )
        
        return {
            "success": True,
            "message_id": message_id,
            "classification_label": classification_label,
            "is_verified": is_verified,
            "is_destroyed": is_destroyed,
            "confidence": confidence
        }
        
    except Exception as e:
        print(f"[DUAL] Error saving/broadcasting: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan pesan: {str(e)}")


# Kirim Pesan Terenkripsi (Legacy) 
@router.post("/{chat_id}/messages/encrypted", summary="Kirim Pesan Terenkripsi (Legacy)")
async def send_encrypted_message(
    chat_id: str,
    request: SendEncryptedMessageRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    LEGACY: Menerima pesan terenkripsi dari client.
    Gunakan endpoint /dual-encrypted untuk implementasi baru.
    """
    user_id = str(current_user["_id"])
    
    # Verifikasi user adalah participant chat
    chat = await get_collection("chats").find_one({"_id": ObjectId(chat_id)})
    if not chat:
        raise HTTPException(status_code=404, detail="Chat tidak ditemukan")
    
    if user_id not in chat.get("participants", []):
        raise HTTPException(status_code=403, detail="Anda bukan peserta chat")
    
    try:
        # Proses pesan terenkripsi
        result = await ChatService.send_encrypted_message(
            chat_id=chat_id,
            sender_id=user_id,
            encrypted_content=request.encrypted_content,
            encrypted_aes_key=request.encrypted_aes_key,
            iv=request.iv,
            message_hash=request.message_hash,
            reply_to_id=request.reply_to_id
        )
        
        # Broadcast ke participant lain
        await manager.broadcast_to_chat(
            chat_id=chat_id,
            data={
                "event": "new_message",
                "data": {
                    "id": result["message_id"],
                    "chat_id": chat_id,
                    "sender_id": user_id,
                    "sender_name": current_user.get("display_name"),
                    "sender_avatar": current_user.get("avatar_url"),
                    "classification_label": result["classification_label"],
                    "is_destroyed": result.get("is_destroyed", False),
                    "is_verified": result["is_verified"],
                    "content_preview": "Pesan berbahaya telah diblokir" if result.get("is_destroyed") else None,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
            },
            exclude_user_id=user_id
        )
        
        return {
            "success": True,
            "message_id": result["message_id"],
            "classification_label": result["classification_label"],
            "is_verified": result["is_verified"],
            "is_destroyed": result.get("is_destroyed", False)
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
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


# ── Test Klasifikasi (DEBUG) ──────────────────────────────
@router.post("/test-classify", summary="Test Klasifikasi Langsung (DEBUG)")
async def test_classify_direct(
    request: dict,
    current_user: dict = Depends(get_current_user),
):
    """
    TESTING ONLY: Klasifikasi pesan langsung tanpa enkripsi
    Menggunakan method prediksi() dari model
    """
    text = request.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    try:
        # Panggil method classify
        label, confidence = classification_service.classify(text)
        
        return {
            "original_text": text,
            "classification_label": label,
            "confidence_percent": confidence * 100,
            "model_loaded": classification_service.model is not None
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "original_text": text,
            "error": str(e),
            "classification_label": "Tidak Berisiko",
            "model_loaded": False
        }


# ── Cek Status Model ──────────────────────────────────────
@router.get("/model-status", summary="Cek Status Model")
async def check_model_status(
    current_user: dict = Depends(get_current_user),
):
    """Cek apakah model berhasil dimuat"""
    from app.services.classification_service import classification_service
    
    return {
        "model_loaded": classification_service.model is not None,
        "vectorizer_loaded": classification_service.vectorizer is not None,
        "stopwords_count": len(classification_service.stopwords),
        "model_path": os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "model", "model_naive_bayes.joblib")
    }


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