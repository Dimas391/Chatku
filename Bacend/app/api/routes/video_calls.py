import logging
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId

from app.middleware.auth import get_current_user, get_current_user_id
from app.services.video_call_service import video_call_service
from app.services.websocket_manager import manager
from app.services.notification_service import NotificationService
from app.core.database import get_collection
from app.models.video_call import (
    InitiateVideoCallRequest,
    VideoCallState,
)

router = APIRouter(prefix="/video-calls", tags=["Video Calls"])
logger = logging.getLogger(__name__)
notification_svc = NotificationService()


@router.post("/initiate", summary="Mulai Panggilan Video")
async def initiate_video_call(
    request: InitiateVideoCallRequest,
    current_user: dict = Depends(get_current_user),
):
    caller_id = str(current_user["_id"])

    if not ObjectId.is_valid(request.callee_id):
        raise HTTPException(status_code=400, detail="ID penerima tidak valid")

    callee = await get_collection("users").find_one({"_id": ObjectId(request.callee_id)})
    if not callee:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")

    active_call = await video_call_service.get_active_call(caller_id)
    if active_call:
        raise HTTPException(status_code=409, detail="Anda sedang dalam panggilan video lain")

    result = await video_call_service.initiate_video_call(
        caller_id=caller_id,
        callee_id=request.callee_id,
        chat_id=request.chat_id,
    )

    if not result["success"]:
        if result.get("reason") == "busy":
            raise HTTPException(status_code=409, detail="Pengguna sedang sibuk")
        raise HTTPException(status_code=500, detail="Gagal memulai panggilan video")

    call_id = result["call_id"]
    caller_name = current_user.get("display_name", "Seseorang")

    # Kirim notifikasi via WebSocket
    ws_sent = await manager.notify_incoming_call(
        callee_id=request.callee_id,
        call_id=call_id,
        caller_id=caller_id,
        call_type="video",
        chat_id=request.chat_id,
    )

    if not ws_sent:
        callee_token = callee.get("notification_token")
        if callee_token:
            await notification_svc.send_incoming_call_notification(
                device_token=callee_token,
                caller_name=caller_name,
                call_type="video",
                call_id=call_id,
                chat_id=request.chat_id,
            )

    await video_call_service.update_call_state(call_id, VideoCallState.RINGING)

    return {
        "call_id": call_id,
        "type": "video",
        "state": VideoCallState.RINGING,
        "callee_id": request.callee_id,
        "callee_name": callee.get("display_name"),
        "callee_avatar": callee.get("avatar_url"),
        "chat_id": request.chat_id,
        "started_at": result["call_data"]["started_at"],
    }


@router.post("/{call_id}/answer", summary="Jawab Panggilan Video")
async def answer_video_call(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await video_call_service.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    if call_data["callee_id"] != user_id:
        raise HTTPException(status_code=403, detail="Bukan panggilan untuk Anda")

    if call_data["state"] not in (VideoCallState.INITIATING, VideoCallState.RINGING):
        raise HTTPException(status_code=409, detail="Panggilan tidak bisa dijawab")

    await video_call_service.update_call_state(call_id, VideoCallState.ANSWERED)

    await manager.send_to_user(
        call_data["caller_id"],
        {
            "event": "call_answered",
            "call_id": call_id,
            "answerer_id": user_id,
        },
    )
    return {"call_id": call_id, "state": VideoCallState.ANSWERED}


@router.post("/{call_id}/decline", summary="Tolak Panggilan Video")
async def decline_video_call(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await video_call_service.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    await video_call_service.end_call(call_id, ended_by=user_id)

    await manager.send_to_user(
        call_data["caller_id"],
        {"event": "call_declined", "call_id": call_id, "declined_by": user_id},
    )
    return {"call_id": call_id, "state": VideoCallState.DECLINED}


@router.post("/{call_id}/end", summary="Akhiri Panggilan Video")
async def end_video_call(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await video_call_service.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    if user_id not in call_data.get("participants", [user_id]):
        raise HTTPException(status_code=403, detail="Anda bukan peserta panggilan ini")

    result = await video_call_service.end_call(call_id, ended_by=user_id)
    if not result:
        raise HTTPException(status_code=500, detail="Gagal mengakhiri panggilan")

    for participant_id in call_data.get("participants", []):
        if participant_id != user_id:
            await manager.send_to_user(
                participant_id,
                {
                    "event": "call_ended",
                    "call_id": call_id,
                    "ended_by": user_id,
                    "duration_seconds": result.get("duration_seconds"),
                },
            )
    return {
        "call_id": call_id,
        "state": result.get("state"),
        "duration_seconds": result.get("duration_seconds"),
    }

@router.delete("/{call_id}", summary="Hapus Riwayat Panggilan Video")
async def delete_video_call_history(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Hapus riwayat panggilan video dari database."""
    call = await get_collection("video_calls").find_one({"call_id": call_id})
    if not call:
        raise HTTPException(status_code=404, detail="Riwayat panggilan tidak ditemukan")
    
    if user_id not in call.get("participants", []):
        raise HTTPException(status_code=403, detail="Anda bukan peserta panggilan ini")
    
    result = await get_collection("video_calls").delete_one({"call_id": call_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Gagal menghapus riwayat panggilan")
    
    return {"success": True, "message": "Riwayat panggilan berhasil dihapus"}

@router.get("/{call_id}", summary="Info Panggilan Video")
async def get_video_call(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await video_call_service.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    if user_id not in (call_data.get("caller_id"), call_data.get("callee_id")):
        raise HTTPException(status_code=403, detail="Akses ditolak")

    return call_data


@router.get("/history", summary="Riwayat Panggilan Video Saya")
async def get_video_call_history(
    skip: int = 0,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
):
    history = await video_call_service.get_call_history(user_id, skip=skip, limit=limit)
    return {"calls": history, "total": len(history)}