from datetime import datetime, timezone
from typing import Optional, List, Any
from enum import Enum
from pydantic import BaseModel, Field # type: ignore
from bson import ObjectId # type: ignore

from app.models.user import PyObjectId


# ── Enums 
class ChatType(str, Enum):
    PERSONAL = "personal"
    GROUP = "group"

class MessageType(str, Enum):
    TEXT = "text"
    IMAGE = "image"
    VIDEO = "video"
    AUDIO = "audio"
    FILE = "file"
    SYSTEM = "system"      # pesan sistem (user bergabung, dll)
    CALL_LOG = "call_log"  # log riwayat panggilan


class MessageStatus(str, Enum):
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    FAILED = "failed"


class CallStatus(str, Enum):
    MISSED = "missed"
    ANSWERED = "answered"
    DECLINED = "declined"


# ── Chat Room Model ───────────────────────────────────────
class ChatDocument(BaseModel):
    """Dokumen Chat Room di MongoDB."""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    type: ChatType = ChatType.PERSONAL
    name: Optional[str] = None                  # untuk grup
    avatar_url: Optional[str] = None            # foto grup
    description: Optional[str] = None
    participants: List[str] = []                # list user_id
    admins: List[str] = []                      # untuk grup
    created_by: Optional[str] = None
    last_message_id: Optional[str] = None
    last_message_text: Optional[str] = None
    last_message_at: Optional[datetime] = None
    last_message_by: Optional[str] = None
    is_active: bool = True
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ── Message Model ─────────────────────────────────────────
class MessageDocument(BaseModel):
    """Dokumen Message di MongoDB dengan dual encryption."""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    chat_id: str
    sender_id: str
    type: MessageType = MessageType.TEXT
    
    # 🔐 Dual encrypted fields for end-to-end encryption
    encrypted_content_user: Optional[str] = None   # Untuk user (end-to-end)
    encrypted_aes_key_user: Optional[str] = None   # AES key untuk user (RSA encrypted with recipient's public key)
    
    # 🔐 For server classification (temporary, will be deleted after processing)
    encrypted_content_server: Optional[str] = None  # Untuk server (klasifikasi)
    encrypted_aes_key_server: Optional[str] = None  # AES key untuk server (RSA encrypted with server's public key)
    
    # Encryption metadata
    iv: Optional[str] = None                    # Initialization vector for AES
    message_hash: Optional[str] = None          # SHA-256 hash for integrity
    
    # Legacy fields (for backward compatibility - will be deprecated)
    content: Optional[str] = None               # teks pesan (plain, legacy)
    media_url: Optional[str] = None             # URL file/gambar/video
    media_thumbnail: Optional[str] = None
    media_size: Optional[int] = None            # bytes
    media_duration: Optional[int] = None        # detik (audio/video)
    
    # Classification & Security
    classification_label: Optional[str] = None  # "Berisiko" or "Tidak Berisiko"
    classification_confidence: Optional[float] = None
    is_verified: bool = True                    # Hash verification status
    is_destroyed: bool = False                  # True if message content was destroyed (dangerous content)
    
    # Standard fields
    reply_to_id: Optional[str] = None           # quote/reply
    is_deleted: bool = False
    deleted_for: List[str] = []                 # delete hanya untuk user tertentu
    status: MessageStatus = MessageStatus.SENT
    read_by: List[str] = []                     # list user_id yang sudah baca
    delivered_to: List[str] = []

    # Khusus call_log
    call_status: Optional[CallStatus] = None
    call_duration: Optional[int] = None         # detik
    call_type: Optional[str] = None             # "audio" | "video"

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ── Request/Response Schemas ──────────────────────────────
class CreateChatRequest(BaseModel):
    participant_id: str      # untuk personal chat
    type: ChatType = ChatType.PERSONAL


class CreateGroupRequest(BaseModel):
    name: str
    participant_ids: List[str]
    description: Optional[str] = None


class SendMessageRequest(BaseModel):
    content: Optional[str] = None
    type: MessageType = MessageType.TEXT
    reply_to_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {"content": "Halo!", "type": "text"}
        }


class SendEncryptedMessageRequest(BaseModel):
    """Request untuk mengirim pesan terenkripsi (LEGACY)."""
    encrypted_content: str
    encrypted_aes_key: str
    iv: str
    message_hash: str
    type: MessageType = MessageType.TEXT
    reply_to_id: Optional[str] = None


class DualEncryptedMessageRequest(BaseModel):
    """Request untuk mengirim pesan dual-encrypted"""
    # Sesuaikan dengan nama field dari frontend
    encrypted_content_user: str      # dari frontend
    encrypted_content_server: str    # dari frontend
    encrypted_aes_key_user: str      # dari frontend
    encrypted_aes_key_server: str    # dari frontend
    iv: str
    message_hash: str
    type: MessageType = MessageType.TEXT
    reply_to_id: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "encrypted_content_user": "encrypted_content_for_user",
                "encrypted_content_server": "encrypted_content_for_server",
                "encrypted_aes_key_user": "aes_key_encrypted_with_recipient_rsa",
                "encrypted_aes_key_server": "aes_key_encrypted_with_server_rsa",
                "iv": "initialization_vector",
                "message_hash": "sha256_hash",
                "type": "text"
            }
        }

class DualEncryptedMessageResponse(BaseModel):
    """Response untuk pesan dual-encrypted."""
    success: bool
    message_id: str
    classification_label: str
    is_verified: bool
    is_destroyed: bool = False
    confidence: Optional[float] = None

class MessageResponse(BaseModel):
    """Response pesan (tanpa plaintext untuk keamanan)."""
    id: str
    chat_id: str
    sender_id: str
    type: str
    encrypted_content_user: Optional[str] = None  # Dual encryption field
    encrypted_aes_key_user: Optional[str] = None  # Dual encryption field
    encrypted_content: Optional[str] = None       # Legacy support
    content: Optional[str] = None                 # Legacy support
    media_url: Optional[str] = None
    iv: Optional[str] = None
    message_hash: Optional[str] = None
    reply_to_id: Optional[str] = None
    is_deleted: bool = False
    status: str
    read_by: List[str] = []
    classification_label: Optional[str] = None
    is_verified: bool = True
    is_destroyed: bool = False
    call_status: Optional[str] = None
    call_duration: Optional[int] = None
    call_type: Optional[str] = None
    created_at: datetime


class ChatResponse(BaseModel):
    id: str
    type: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    participants: List[str] = []
    last_message_text: Optional[str] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime