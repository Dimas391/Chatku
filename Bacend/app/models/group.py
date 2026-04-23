from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field # type: ignore
from bson import ObjectId # type: ignore
from app.models.user import PyObjectId


class GroupUpdateRequest(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {"name": "Tim Dev", "description": "Grup diskusi development"}
        }


class AddMembersRequest(BaseModel):
    user_ids: List[str]

    class Config:
        json_schema_extra = {"example": {"user_ids": ["user_id_1", "user_id_2"]}}


class PromoteAdminRequest(BaseModel):
    user_id: str


class GroupInfoResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    avatar_url: Optional[str] = None
    participants: List[str]
    admins: List[str]
    created_by: str
    member_count: int
    created_at: datetime
