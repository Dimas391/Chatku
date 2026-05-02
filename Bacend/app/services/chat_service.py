import logging
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

from bson import ObjectId # type: ignore

from app.core.database import get_collection
from app.models.chat import (
    ChatDocument,
    MessageDocument,
    ChatType,
    MessageType,
    MessageStatus,
    CallStatus
)
from app.services.encryption_service import encryption_service
from app.services.classification_service import classification_service

logger = logging.getLogger(__name__)


class ChatService:
    """Layanan manajemen chat dan pesan dengan dukungan enkripsi."""

    # ── Chat Room ─────────────────────────────────────────
    @staticmethod
    async def get_or_create_personal_chat(
        user_id: str, participant_id: str
    ) -> Tuple[dict, bool]:
        """
        Ambil atau buat personal chat room antara dua user.
        Returns: (chat_document, is_new)
        """
        chats_col = get_collection("chats")

        # Cari existing chat
        existing = await chats_col.find_one(
            {
                "type": ChatType.PERSONAL,
                "participants": {"$all": [user_id, participant_id], "$size": 2},
            }
        )
        if existing:
            return existing, False

        # Buat chat baru
        new_chat = ChatDocument(
            type=ChatType.PERSONAL,
            participants=[user_id, participant_id],
            created_by=user_id,
        )
        result = await chats_col.insert_one(
            new_chat.model_dump(by_alias=True, exclude={"id"})
        )
        chat = await chats_col.find_one({"_id": result.inserted_id})
        return chat, True

    @staticmethod
    async def create_group_chat(
        creator_id: str,
        name: str,
        participant_ids: List[str],
        description: Optional[str] = None,
    ) -> dict:
        """Buat grup chat baru."""
        chats_col = get_collection("chats")
        all_participants = list({creator_id, *participant_ids})

        new_chat = ChatDocument(
            type=ChatType.GROUP,
            name=name,
            description=description,
            participants=all_participants,
            admins=[creator_id],
            created_by=creator_id,
        )
        result = await chats_col.insert_one(
            new_chat.model_dump(by_alias=True, exclude={"id"})
        )
        return await chats_col.find_one({"_id": result.inserted_id})

    @staticmethod
    async def get_user_chats(user_id: str, skip: int = 0, limit: int = 50) -> List[dict]:
        """Ambil semua chat milik user, diurutkan dari pesan terbaru."""
        chats_col = get_collection("chats")
        cursor = (
            chats_col.find(
                {"participants": user_id, "is_active": True}
            )
            .sort("last_message_at", -1)
            .skip(skip)
            .limit(limit)
        )
        return await cursor.to_list(length=limit)

    @staticmethod
    async def get_chat_by_id(chat_id: str, user_id: str) -> Optional[dict]:
        """Ambil chat berdasarkan ID, pastikan user adalah peserta."""
        return await get_collection("chats").find_one(
            {"_id": ObjectId(chat_id), "participants": user_id}
        )

    @staticmethod
    async def delete_chat(chat_id: str, user_id: str) -> bool:
        """Keluarkan user dari chat, hapus chat jika peserta kosong."""
        chats_col = get_collection("chats")
        chat = await chats_col.find_one({"_id": ObjectId(chat_id)})
        if not chat:
            return False

        if user_id in chat.get("participants", []):
            await chats_col.update_one(
                {"_id": ObjectId(chat_id)},
                {"$pull": {"participants": user_id}}
            )
            updated_chat = await chats_col.find_one({"_id": ObjectId(chat_id)})
            if not updated_chat.get("participants"):
                await chats_col.delete_one({"_id": ObjectId(chat_id)})
                await get_collection("messages").delete_many({"chat_id": chat_id})
            return True
        return False

    # ── Messages (Legacy - Plain Text) ──────────────────────────
    @staticmethod
    async def send_message(
        chat_id: str,
        sender_id: str,
        content: Optional[str],
        msg_type: MessageType = MessageType.TEXT,
        reply_to_id: Optional[str] = None,
        media_url: Optional[str] = None,
        media_size: Optional[int] = None,
        media_duration: Optional[int] = None,
    ) -> dict:
        """
        Simpan pesan plain text ke database (LEGACY - untuk kompatibilitas).
        Gunakan send_encrypted_message untuk pesan baru.
        """
        messages_col = get_collection("messages")
        chats_col = get_collection("chats")

        # Klasifikasi pesan jika tipenya teks
        classification_label = "Tidak Berisiko"
        confidence = 1.0
        
        if msg_type == MessageType.TEXT and content:
            logger.info(" Classifying legacy message...")
            classification_label, confidence = classification_service.classify(content)
            
            # Jika Berisiko, hancurkan isi pesan (hash)
            if classification_label == "Berisiko":
                import hashlib
                content = f"[KONTEN BERBAHAYA DIHANCURKAN]: {hashlib.sha256(content.encode()).hexdigest()[:20]}..."
                logger.warning("Dangerous legacy content destroyed/hashed.")

        new_msg = MessageDocument(
            chat_id=chat_id,
            sender_id=sender_id,
            type=msg_type,
            content=content,
            reply_to_id=reply_to_id,
            media_url=media_url,
            media_size=media_size,
            media_duration=media_duration,
            classification_label=classification_label,
            classification_confidence=confidence,
            status=MessageStatus.SENT,
        )
        result = await messages_col.insert_one(
            new_msg.model_dump(by_alias=True, exclude={"id"})
        )
        message = await messages_col.find_one({"_id": result.inserted_id})

        # Update info pesan terakhir di chat room
        preview = content or ("[Media]" if media_url else "[Pesan]")
        await chats_col.update_one(
            {"_id": ObjectId(chat_id)},
            {
                "$set": {
                    "last_message_id": str(result.inserted_id),
                    "last_message_text": preview[:100],
                    "last_message_at": datetime.now(timezone.utc),
                    "last_message_by": sender_id,
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        return message

    # ── Encrypted Messages (New) ────────────────────────────────
    @staticmethod
    async def send_encrypted_message(
        chat_id: str,
        sender_id: str,
        encrypted_content: str,
        encrypted_aes_key: str,
        iv: str,
        message_hash: str,
        reply_to_id: Optional[str] = None
    ) -> Dict:
        """
        Proses dan simpan pesan terenkripsi:
        1. Dekripsi AES key dengan RSA private key
        2. Dekripsi pesan dengan AES key
        3. Verifikasi hash
        4. Klasifikasi dengan Naive Bayes
        5. Jika BERISIKO → Hancurkan SEMUA data (ciphertext, key, iv)
        6. Jika TIDAK BERISIKO → Simpan ciphertext
        """
        plaintext = None
        aes_key = None
        messages_col = get_collection("messages")
        chats_col = get_collection("chats")
        
        try:
            # Step 1: Decrypt AES key dengan RSA
            logger.info("Decrypting AES key...")
            aes_key = encryption_service.decrypt_aes_key(encrypted_aes_key)
            
            # Step 2: Decrypt message dengan AES
            logger.info("Decrypting message...")
            plaintext = encryption_service.decrypt_message(encrypted_content, aes_key, iv)
            
            # Step 3: Verify hash
            logger.info("Verifying hash...")
            is_verified = encryption_service.verify_message_hash(plaintext, message_hash)
            
            # Step 4: Klasifikasi pesan
            logger.info("Classifying message...")
            classification_label, confidence = classification_service.classify(plaintext)
            
            confidence = float(confidence) if confidence else 0.5

            # Dan label adalah string
            if isinstance(classification_label, (bytes, bytearray)):
                classification_label = classification_label.decode('utf-8')
            elif hasattr(classification_label, '__str__'):
                classification_label = str(classification_label)
            
            # HAPUS PLAINTEXT DARI MEMORI (AMAN)
            encryption_service.clear_memory(plaintext, aes_key)
            plaintext = None
            aes_key = None
            
            # Step 5: Jika BERISIKO, hancurkan SEMUA data agar tidak bisa didekripsi user
            if classification_label == "Berisiko":
                import hashlib
                logger.warning(f"DANGEROUS MESSAGE DETECTED! Destroying all message data.")
                
                # Hancurkan semua komponen pesan
                destroyed_content = f"[KONTEN BERBAHAYA TELAH DIHANCURKAN OLEH SISTEM - {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S')}⚠️]"
                destroyed_hash = hashlib.sha256(destroyed_content.encode()).hexdigest()
                
                message_doc = MessageDocument(
                    chat_id=chat_id,
                    sender_id=sender_id,
                    type=MessageType.TEXT,
                    #  Pesan asli TIDAK bisa direcover - semua data encryption dihancurkan
                    encrypted_content=f"BLOCKED_BY_SECURITY_{destroyed_hash[:32]}",
                    encrypted_aes_key="DESTROYED_FOR_SAFETY",
                    iv="DESTROYED_FOR_SAFETY",
                    message_hash=destroyed_hash,
                    # Untuk keperluan display di UI, simpan pesan peringatan (tidak terenkripsi)
                    content=destroyed_content,
                    classification_label=classification_label,
                    classification_confidence=confidence,
                    is_verified=False,  # Mark as tampered/unverified
                    reply_to_id=reply_to_id,
                    status=MessageStatus.SENT,
                )
            else:
                # TIDAK BERISIKO - Simpan ciphertext seperti biasa
                message_doc = MessageDocument(
                    chat_id=chat_id,
                    sender_id=sender_id,
                    type=MessageType.TEXT,
                    encrypted_content=encrypted_content,
                    encrypted_aes_key=encrypted_aes_key,
                    iv=iv,
                    message_hash=message_hash,
                    classification_label=classification_label,
                    classification_confidence=confidence,
                    is_verified=is_verified,
                    reply_to_id=reply_to_id,
                    status=MessageStatus.SENT,
                )
            
            result = await messages_col.insert_one(
                message_doc.model_dump(by_alias=True, exclude={"id"})
            )
            
            # Update last message preview di chat room
            if classification_label == "Berisiko":
                preview = "Pesan berbahaya telah diblokir oleh sistem"
            else:
                preview = "[Pesan terenkripsi]"
                
            await chats_col.update_one(
                {"_id": ObjectId(chat_id)},
                {
                    "$set": {
                        "last_message_id": str(result.inserted_id),
                        "last_message_text": preview[:100],
                        "last_message_at": datetime.now(timezone.utc),
                        "last_message_by": sender_id,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            
            logger.info(f"Message saved. Classification: {classification_label}")
            
            return {
                "message_id": str(result.inserted_id),
                "classification_label": classification_label,
                "is_verified": is_verified if classification_label != "Berisiko" else False,
                "confidence": confidence,
                "is_destroyed": classification_label == "Berisiko"
            }
            
        except Exception as e:
            logger.error(f"Failed to process encrypted message: {e}")
            encryption_service.clear_memory(plaintext, aes_key)
            raise
    
    @staticmethod
    async def send_dual_encrypted_message(
        chat_id: str,
        sender_id: str,
        encrypted_content_user: str,
        encrypted_content_server: str,
        encrypted_aes_key_user: str,
        encrypted_aes_key_server: str,
        iv: str,
        message_hash: str,
        reply_to_id: Optional[str] = None
    ) -> Dict:
        """
        Proses pesan dual-encrypted:
        1. Server decrypt dengan server key untuk klasifikasi
        2. Server TIDAK bisa decrypt user key
        3. Simpan user ciphertext untuk penerima
        """
        messages_col = get_collection("messages")
        chats_col = get_collection("chats")
        
        try:
            # SERVER DECRYPT untuk klasifikasi
            logger.info("Server decrypting with server key...")
            
            # Decrypt server key (server punya private key sendiri)
            # TODO: Gunakan private key server yang sudah ada
            from app.services.encryption_service import encryption_service
            server_key = encryption_service.decrypt_aes_key(encrypted_aes_key_server)
            
            # Decrypt message for classification
            plaintext = encryption_service.decrypt_message(encrypted_content_server, server_key, iv)
            
            # Verify hash
            is_verified = encryption_service.verify_message_hash(plaintext, message_hash)
            
            # KLASIFIKASI
            logger.info("Classifying message...")
            result = classification_service.prediksi(plaintext)
            classification_label = result["label"]
            confidence = result["keyakinan"] / 100
            
            logger.info(f"Classification: {classification_label} ({confidence:.2f})")
            
            # HAPUS PLAINTEXT DARI MEMORI
            encryption_service.clear_memory(plaintext, server_key)
            
            # IMPAN ke database (hanya user ciphertext, bukan server)
            message_doc = MessageDocument(
                chat_id=chat_id,
                sender_id=sender_id,
                type=MessageType.TEXT,
                encrypted_content_user=encrypted_content_user,
                encrypted_aes_key_user=encrypted_aes_key_user,
                iv=iv,
                message_hash=message_hash,
                classification_label=classification_label,
                classification_confidence=confidence,
                is_verified=is_verified,
                is_destroyed=classification_label == "Berisiko",
                reply_to_id=reply_to_id,
                status=MessageStatus.SENT,
            )
            
            result = await messages_col.insert_one(
                message_doc.model_dump(by_alias=True, exclude={"id"})
            )
            
            # Update last message preview di chat room
            if classification_label == "Berisiko":
                preview = " Pesan berbahaya telah diblokir oleh sistem"
            else:
                preview = "[Pesan terenkripsi]"
                
            await chats_col.update_one(
                {"_id": ObjectId(chat_id)},
                {
                    "$set": {
                        "last_message_id": str(result.inserted_id),
                        "last_message_text": preview,
                        "last_message_at": datetime.now(timezone.utc),
                        "last_message_by": sender_id,
                        "updated_at": datetime.now(timezone.utc),
                    }
                },
            )
            
            logger.info(f"Dual encrypted message saved. Classification: {classification_label}")
            
            return {
                "message_id": str(result.inserted_id),
                "classification_label": classification_label,
                "is_verified": is_verified,
                "is_destroyed": classification_label == "Berisiko"
            }
            
        except Exception as e:
            logger.error(f"Failed to process dual encrypted message: {e}")
            raise

    # ── Get Messages (Support Both Formats) ─────────────────────
    @staticmethod
    async def get_messages(
        chat_id: str,
        user_id: str,
        before_id: Optional[str] = None,
        limit: int = 50,
    ) -> List[dict]:
        """
        Ambil pesan di chat room dengan cursor-based pagination.
        """
        logger.info(f" [SERVICE] get_messages called for chat: {chat_id}")
        
        messages_col = get_collection("messages")
        query: dict = {
            "chat_id": chat_id,
            "deleted_for": {"$nin": [user_id]},
        }
        if before_id and ObjectId.is_valid(before_id):
            query["_id"] = {"$lt": ObjectId(before_id)}
            logger.info(f" [SERVICE] Using before_id: {before_id}")

        try:
            logger.info(f"[SERVICE] Query: {query}")
            
            cursor = (
                messages_col.find(query)
                .sort("_id", -1)
                .limit(limit)
            )
            messages = await cursor.to_list(length=limit)
            
            logger.info(f" [SERVICE] Found {len(messages)} messages")
            
            # Log sample message if exists
            if messages:
                logger.info(f" [SERVICE] Sample message: {messages[0].get('_id')} - {messages[0].get('classification_label')}")
            
            # Format messages
            formatted_messages = []
            for msg in reversed(messages):  # balik urutan untuk tampil dari atas
                formatted = ChatService.format_message(msg)
                formatted_messages.append(formatted)
            
            logger.info(f" [SERVICE] Formatted {len(formatted_messages)} messages")
            return formatted_messages
            
        except Exception as e:
            logger.error(f"[SERVICE] Error in get_messages: {e}")
            import traceback
            traceback.print_exc()
            raise

    @staticmethod
    async def mark_messages_read(chat_id: str, user_id: str) -> int:
        """Tandai semua pesan belum terbaca sebagai 'read'. Return jumlah yang diupdate."""
        result = await get_collection("messages").update_many(
            {
                "chat_id": chat_id,
                "sender_id": {"$ne": user_id},
                "read_by": {"$nin": [user_id]},
            },
            {
                "$addToSet": {"read_by": user_id},
                "$set": {
                    "status": MessageStatus.READ,
                    "updated_at": datetime.now(timezone.utc),
                },
            },
        )
        return result.modified_count

    @staticmethod
    async def delete_message(
        message_id: str, user_id: str, delete_for_everyone: bool = False
    ) -> bool:
        """Hapus pesan. Bisa hapus untuk diri sendiri atau semua."""
        messages_col = get_collection("messages")
        message = await messages_col.find_one({"_id": ObjectId(message_id)})
        if not message:
            return False

        if delete_for_everyone and message["sender_id"] == user_id:
            await messages_col.update_one(
                {"_id": ObjectId(message_id)},
                {"$set": {"is_deleted": True, "content": None, "media_url": None, "encrypted_content": None}},
            )
        else:
            await messages_col.update_one(
                {"_id": ObjectId(message_id)},
                {"$addToSet": {"deleted_for": user_id}},
            )
        return True

    @staticmethod
    async def get_unread_count(chat_id: str, user_id: str) -> int:
        """Hitung jumlah pesan belum terbaca."""
        return await get_collection("messages").count_documents(
            {
                "chat_id": chat_id,
                "sender_id": {"$ne": user_id},
                "read_by": {"$nin": [user_id]},
            }
        )

    @staticmethod
    async def hash_message_content(message_id: str, chat_id: str) -> bool:
        """Hancurkan isi pesan dengan hashing (untuk konten berbahaya)."""
        import hashlib
        messages_col = get_collection("messages")
        message = await messages_col.find_one({"_id": ObjectId(message_id), "chat_id": chat_id})
        
        if not message:
            return False
            
        update_data = {
            "classification_label": "Berisiko",
            "updated_at": datetime.now(timezone.utc)
        }
        
        # Hancurkan content jika ada
        if message.get("content"):
            update_data["content"] = f"[KONTEN BERBAHAYA DIHANCURKAN]: {hashlib.sha256(message['content'].encode()).hexdigest()[:20]}..."
            
        # Hancurkan encrypted content jika ada
        if message.get("encrypted_content"):
            update_data["encrypted_content"] = f"DANGER_HASHED_{hashlib.sha256(message['encrypted_content'].encode()).hexdigest()[:16]}"
            update_data["encrypted_aes_key"] = "DESTROYED_FOR_SAFETY"
            update_data["message_hash"] = "INVALIDATED"
            
        await messages_col.update_one({"_id": ObjectId(message_id)}, {"$set": update_data})
        return True

    # ── Format untuk response ─────────────────────────────
    @staticmethod   
    def format_message(msg: dict) -> dict:
        """Konversi dokumen MongoDB ke dict response."""
        logger.info(f"[FORMAT] Formatting message: {msg.get('_id')}")
        
        try:
            # Handle created_at
            created_at = msg.get("created_at")
            if created_at:
                if isinstance(created_at, datetime):
                    created_at_str = created_at.isoformat() + 'Z'
                else:
                    created_at_str = str(created_at)
            else:
                created_at_str = datetime.now(timezone.utc).isoformat() + 'Z'
            
            # Check if message is destroyed
            is_destroyed = msg.get("is_destroyed", False)
            if msg.get("classification_label") == "Berisiko":
                is_destroyed = True
            if msg.get("content") and "[KONTEN BERBAHAYA DIHANCURKAN]" in str(msg.get("content", "")):
                is_destroyed = True
            
            # Dual-encrypted message fields
            has_dual_encrypted = msg.get("encrypted_content_user") is not None and not is_destroyed
            # Legacy encrypted message fields
            has_encrypted = msg.get("encrypted_content") is not None and not is_destroyed and not has_dual_encrypted
            
            if is_destroyed:
                content_display = msg.get("content") or "[KONTEN BERBAHAYA TELAH DIHANCURKAN OLEH SISTEM] "
                encrypted_content = None
                encrypted_content_user = None
                encrypted_aes_key_user = None
                encrypted_aes_key_sender = None
            elif has_dual_encrypted:
                content_display = None
                encrypted_content = None  # legacy field kosong
                encrypted_content_user = msg.get("encrypted_content_user")
                encrypted_aes_key_user = msg.get("encrypted_aes_key_user")
                encrypted_aes_key_sender = msg.get("encrypted_aes_key_sender")
            else:
                content_display = None if has_encrypted else msg.get("content")
                encrypted_content = msg.get("encrypted_content") if has_encrypted else None
                encrypted_content_user = None
                encrypted_aes_key_user = None
                encrypted_aes_key_sender = None
            
            # Handle ObjectId
            msg_id = msg.get("_id")
            if msg_id and hasattr(msg_id, '__str__'):
                msg_id_str = str(msg_id)
            else:
                msg_id_str = msg_id
            
            result = {
                "id": msg_id_str,
                "chat_id": msg.get("chat_id"),
                "sender_id": msg.get("sender_id"),
                "sender_name": msg.get("sender_name"),
                "sender_avatar": msg.get("sender_avatar"),
                "type": msg.get("type", "text"),
                "content": content_display,
                # Legacy encrypted fields
                "encrypted_content": encrypted_content,
                "encrypted_aes_key": msg.get("encrypted_aes_key") if has_encrypted else None,
                # Dual encrypted fields (new)
                "encrypted_content_user": encrypted_content_user,
                "encrypted_aes_key_user": encrypted_aes_key_user,
                "encrypted_aes_key_sender": encrypted_aes_key_sender,
                "media_url": msg.get("media_url"),
                "reply_to_id": msg.get("reply_to_id"),
                "is_deleted": msg.get("is_deleted", False),
                "status": msg.get("status", "sent"),
                "read_by": msg.get("read_by", []),
                "classification_label": msg.get("classification_label"),
                "is_verified": msg.get("is_verified", True),
                "is_destroyed": is_destroyed,
                "iv": msg.get("iv"),
                "message_hash": msg.get("message_hash"),
                "created_at": created_at_str,
            }
            
            logger.info(f" [FORMAT] Formatted message: {msg_id_str} - destroyed={is_destroyed}")
            return result
            
        except Exception as e:
            logger.error(f"[FORMAT] Error formatting message: {e}")
            # Return minimal response
            return {
                "id": str(msg.get("_id", "")),
                "chat_id": msg.get("chat_id", ""),
                "sender_id": msg.get("sender_id", ""),
                "type": "text",
                "content": "[Error loading message]",
                "created_at": datetime.now(timezone.utc).isoformat() + 'Z'
            }