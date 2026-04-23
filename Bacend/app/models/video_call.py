from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field
from bson import ObjectId

from app.models.user import PyObjectId

class VideoCallType(str, Enum):
    VIDEO = "video"

class VideoCallState(str, Enum):
    INITIATING = "initiating"
    RINGING = "ringing"
    ANSWERED = "answered"
    ENDED = "ended"
    MISSED = "missed"
    DECLINED = "declined"
    FAILED = "failed"
    BUSY = "busy"


class VideoCallDocument(BaseModel):
    """Dokumen Video Call di MongoDB."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    call_id: str
    chat_id: str
    caller_id: str
    callee_id: str
    participants: List[str] = []
    type: VideoCallType = VideoCallType.VIDEO
    state: VideoCallState = VideoCallState.INITIATING
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    answered_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    end_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class InitiateVideoCallRequest(BaseModel):
    callee_id: str
    chat_id: str

    class Config:
        json_schema_extra = {
            "example": {
                "callee_id": "user123",
                "chat_id": "chat456"
            }
        }

class VideoCallResponse(BaseModel):
    call_id: str
    type: str
    state: str
    caller_id: str
    callee_id: str
    callee_name: Optional[str] = None
    callee_avatar: Optional[str] = None
    chat_id: str
    started_at: datetime
    answered_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None