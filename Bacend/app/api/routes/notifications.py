from fastapi import APIRouter, Depends, HTTPException # type: ignore
from bson import ObjectId # type: ignore
from datetime import datetime, timezone

from app.middleware.auth import get_current_user_id
from app.core.database import get_collection
from app.models.notification import NotificationDocument, NotificationType

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", summary="Daftar Notifikasi")
async def get_notifications(
    skip: int = 0,
    limit: int = 30,
    user_id: str = Depends(get_current_user_id),
):
    cursor = (
        get_collection("notifications")
        .find({"user_id": user_id})
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )
    notifs = await cursor.to_list(length=limit)
    return {
        "notifications": [
            {
                "id": str(n["_id"]),
                "type": n["type"],
                "title": n["title"],
                "body": n["body"],
                "data": n.get("data"),
                "is_read": n.get("is_read", False),
                "created_at": n["created_at"].isoformat(),
            }
            for n in notifs
        ]
    }


@router.get("/unread-count", summary="Jumlah Notifikasi Belum Terbaca")
async def get_unread_count(user_id: str = Depends(get_current_user_id)):
    count = await get_collection("notifications").count_documents(
        {"user_id": user_id, "is_read": False}
    )
    return {"unread_count": count}


@router.patch("/{notif_id}/read", summary="Tandai Notifikasi Terbaca")
async def mark_read(
    notif_id: str,
    user_id: str = Depends(get_current_user_id),
):
    if not ObjectId.is_valid(notif_id):
        raise HTTPException(status_code=400, detail="ID tidak valid")

    result = await get_collection("notifications").update_one(
        {"_id": ObjectId(notif_id), "user_id": user_id},
        {"$set": {"is_read": True}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    return {"success": True}


@router.patch("/read-all", summary="Tandai Semua Notifikasi Terbaca")
async def mark_all_read(user_id: str = Depends(get_current_user_id)):
    result = await get_collection("notifications").update_many(
        {"user_id": user_id, "is_read": False},
        {"$set": {"is_read": True}},
    )
    return {"success": True, "updated_count": result.modified_count}


@router.delete("/{notif_id}", summary="Hapus Notifikasi")
async def delete_notification(
    notif_id: str,
    user_id: str = Depends(get_current_user_id),
):
    if not ObjectId.is_valid(notif_id):
        raise HTTPException(status_code=400, detail="ID tidak valid")

    result = await get_collection("notifications").delete_one(
        {"_id": ObjectId(notif_id), "user_id": user_id}
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Notifikasi tidak ditemukan")
    return {"success": True}


# ── Helper untuk service lain ─────────────────────────────
async def create_notification(
    user_id: str,
    type: NotificationType,
    title: str,
    body: str,
    data: dict = None,
) -> None:
    """Buat notifikasi baru di database."""
    notif = NotificationDocument(
        user_id=user_id,
        type=type,
        title=title,
        body=body,
        data=data,
    )
    await get_collection("notifications").insert_one(
        notif.model_dump(by_alias=True, exclude={"id"})
    )
