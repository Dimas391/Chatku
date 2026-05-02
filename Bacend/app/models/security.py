from datetime import datetime, timezone
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field # type: ignore
from bson import ObjectId # type: ignore
from app.models.user import PyObjectId

class SecurityScore(BaseModel):
    overall: int = 0
    encryption: int = 0
    authentication: int = 0
    integrity: int = 0
    last_updated: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    
class SecurityFeature(BaseModel):
    id: str
    label: str
    desc: str
    icon: str
    color: str
    active: bool
    category: str  # encryption, auth, integrity

class KeyVerification(BaseModel):
    id: str
    contact_id: str
    contact_name: str
    algorithm: str = "RSA-2048"
    fingerprint: str
    verified: bool = False
    verified_at: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForensicLog(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    user_id: str
    event: str
    detail: str
    category: str  # auth, crypto, network, integrity, access
    severity: str  # info, warning, critical
    hash: str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class SecuritySettings(BaseModel):
    user_id: str
    two_factor_enabled: bool = False
    session_timeout_minutes: int = 30
    max_login_attempts: int = 5
    encryption_level: str = "high"  # low, medium, high
    auto_logout_inactive: bool = True
    notify_new_device: bool = True
    notify_suspicious: bool = True