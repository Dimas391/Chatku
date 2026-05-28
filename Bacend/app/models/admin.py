from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field # type: ignore
from bson import ObjectId # type: ignore
from app.models.user import PyObjectId

class AdminDocument(BaseModel):
    """Dokumen Admin di MongoDB."""
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    username: str
    password_hash: str
    name: str
    role: str  # Administrator, Moderator, Viewer
    is_active: bool = True
    last_login: Optional[datetime] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class AdminLoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    admin: dict