from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field # type: ignore
from bson import ObjectId # type: ignore

from app.models.user import PyObjectId


class CallType(str, Enum):
    AUDIO = "audio"
    VIDEO = "video"


class CallState(str, Enum):
    INITIATING = "initiating"   # caller membuat panggilan
    RINGING = "ringing"         # callee menerima notifikasi
    ANSWERED = "answered"       # callee menjawab
    ENDED = "ended"             # panggilan selesai
    MISSED = "missed"           # tidak dijawab
    DECLINED = "declined"       # ditolak
    FAILED = "failed"           # gagal (network error, dll)
    BUSY = "busy"               # callee sedang dalam panggilan lain


# ── WebRTC Signaling Types ────────────────────────────────
class SignalingType(str, Enum):
    OFFER = "offer"
    ANSWER = "answer"
    ICE_CANDIDATE = "ice-candidate"
    END_CALL = "end-call"
    DECLINE_CALL = "decline-call"
    MUTE_AUDIO = "mute-audio"
    UNMUTE_AUDIO = "unmute-audio"
    TOGGLE_VIDEO = "toggle-video"
    BUSY = "busy"


# ── Call Document ─────────────────────────────────────────
class CallDocument(BaseModel):
    """Dokumen Call di MongoDB untuk riwayat & analytics."""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    call_id: str                         # UUID unik untuk sesi call
    chat_id: str
    caller_id: str
    callee_id: str                       # untuk group call: callee utama
    participants: List[str] = []         # semua peserta
    type: CallType = CallType.AUDIO
    state: CallState = CallState.INITIATING
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    answered_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    end_reason: Optional[str] = None     # "normal", "network_error", dll
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ── Request / Response Schemas ────────────────────────────
class InitiateCallRequest(BaseModel):
    callee_id: str
    type: CallType = CallType.AUDIO
    chat_id: str

    class Config:
        json_schema_extra = {
            "example": {
                "callee_id": "user123",
                "type": "audio",
                "chat_id": "chat456"
            }
        }


class SignalingMessage(BaseModel):
    """Pesan signaling WebRTC yang dikirim via WebSocket."""
    call_id: str
    type: SignalingType
    sdp: Optional[str] = None          # untuk offer/answer
    candidate: Optional[dict] = None   # untuk ICE candidate
    target_user_id: str
    from_user_id: str
    call_type: Optional[CallType] = None


class CallResponse(BaseModel):
    call_id: str
    type: str
    state: str
    caller_id: str
    callee_id: str
    chat_id: str
    started_at: datetime
    answered_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None


class ICEServerConfig(BaseModel):
    """Konfigurasi STUN/TURN server untuk WebRTC."""
    urls: List[str]
    username: Optional[str] = None
    credential: Optional[str] = None
