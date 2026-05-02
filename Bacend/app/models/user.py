from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field # type: ignore
from bson import ObjectId # type: ignore

# ── Helper untuk ObjectId ─────────────────────────────────
class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, info=None):
        if not ObjectId.is_valid(v):
            raise ValueError("ObjectId tidak valid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema, handler):
        field_schema.update(type="string")
        return field_schema
    
class PrivacySettings(BaseModel):
    """Pengaturan privasi user."""
    last_seen: str = "everyone"  # everyone, contacts, nobody
    profile_photo: str = "everyone"  # everyone, contacts, nobody
    status: str = "everyone"  # everyone, contacts, nobody
    read_receipts: bool = True
    typing_indicator: bool = True
    two_factor_auth: bool = False


# ── DB Document Model ─────────────────────────────────────
class UserDocument(BaseModel):
    """Representasi dokumen User di MongoDB."""

    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    username: str
    display_name: str
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    hashed_password: Optional[str] = None
    avatar_url: Optional[str] = None
    bio: Optional[str] = ""
    is_active: bool = True
    is_verified: bool = False
    is_online: bool = False
    last_seen: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    contacts: List[str] = []
    blocked_users: List[str] = []
    notification_token: Optional[str] = None
    rsa_public_key: Optional[str] = None  # TAMBAHKAN INI
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


# ── Request Schemas ───────────────────────────────────────
class UserRegisterRequest(BaseModel):
    """Request body untuk registrasi."""
    phone: Optional[str] = None
    email: Optional[EmailStr] = None
    type: str = "phone"  # "phone" | "email"

    class Config:
        json_schema_extra = {
            "example": {"phone": "081234567890", "type": "phone"}
        }


class UserProfileUpdateRequest(BaseModel):
    """Request body untuk update profil."""
    display_name: Optional[str] = None
    bio: Optional[str] = None
    username: Optional[str] = None


class UpdateNotificationTokenRequest(BaseModel):
    token: str


# ── Response Schemas ──────────────────────────────────────
class UserPublicResponse(BaseModel):
    """Data user yang aman untuk dikirim ke client."""
    id: str
    username: str
    display_name: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = ""
    is_online: bool = False
    last_seen: datetime


class UserProfileResponse(UserPublicResponse):
    """Data profil lengkap untuk user yang login."""
    phone: Optional[str] = None
    email: Optional[str] = None
    is_verified: bool = False
    created_at: datetime
    
class UpdatePrivacySettingsRequest(BaseModel):
    """Request untuk update pengaturan privasi."""
    last_seen: Optional[str] = None
    profile_photo: Optional[str] = None
    status: Optional[str] = None
    read_receipts: Optional[bool] = None
    typing_indicator: Optional[bool] = None
    two_factor_auth: Optional[bool] = None


class PrivacySettingsResponse(BaseModel):
    """Response pengaturan privasi."""
    last_seen: str
    profile_photo: str
    status: str
    read_receipts: bool
    typing_indicator: bool
    two_factor_auth: bool
