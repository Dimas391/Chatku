from datetime import datetime, timezone
from typing import Optional
from enum import Enum
from pydantic import BaseModel, Field # type: ignore
from bson import ObjectId # type: ignore
from app.models.user import PyObjectId


class NotificationType(str, Enum):
    NEW_MESSAGE = "new_message"
    INCOMING_CALL = "incoming_call"
    MISSED_CALL = "missed_call"
    CONTACT_REQUEST = "contact_request"
    GROUP_INVITE = "group_invite"
    SYSTEM = "system"


class NotificationDocument(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    type: NotificationType
    title: str
    body: str
    data: Optional[dict] = None
    is_read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class NotificationResponse(BaseModel):
    id: str
    type: str
    title: str
    body: str
    data: Optional[dict] = None
    is_read: bool
    created_at: datetime
