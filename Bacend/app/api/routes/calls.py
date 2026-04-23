import logging
from fastapi import APIRouter, Depends, HTTPException, status # type: ignore
from bson import ObjectId # type: ignore

from app.middleware.auth import get_current_user, get_current_user_id
from app.services.call_service import CallService
from app.services.websocket_manager import manager
from app.services.notification_service import NotificationService
from app.core.database import get_collection
from app.models.call import (
    InitiateCallRequest,
    SignalingMessage,
    CallType,
    CallState,
)

router = APIRouter(prefix="/calls", tags=["Calls"])
logger = logging.getLogger(__name__)
notification_svc = NotificationService()


# ── ICE Server Config (harus publik, sebelum auth) ────────
@router.get("/ice-servers", summary="Konfigurasi STUN/TURN untuk WebRTC")
async def get_ice_servers(_: str = Depends(get_current_user_id)):
    servers = CallService.get_ice_servers()
    return {
        "ice_servers": [
            {
                "urls": s.urls,
                "username": s.username,
                "credential": s.credential,
            }
            for s in servers
        ]
    }

@router.delete("/{call_id}", summary="Hapus Riwayat Panggilan")
async def delete_call_history(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """
    Hapus riwayat panggilan dari database.
    Hanya bisa dihapus oleh peserta panggilan.
    """
    # Cari call di database
    call = await get_collection("calls").find_one({"call_id": call_id})
    if not call:
        raise HTTPException(status_code=404, detail="Riwayat panggilan tidak ditemukan")
    
    # Cek apakah user adalah peserta panggilan
    if user_id not in call.get("participants", []):
        raise HTTPException(status_code=403, detail="Anda bukan peserta panggilan ini")
    
    # Hapus dari database
    result = await get_collection("calls").delete_one({"call_id": call_id})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Gagal menghapus riwayat panggilan")
    
    return {"success": True, "message": "Riwayat panggilan berhasil dihapus"}

# app/routes/calls.py
@router.get("/history", summary="Riwayat Panggilan Saya")
async def get_call_history(
    skip: int = 0,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
):
    history = await CallService.get_call_history(user_id, skip=skip, limit=limit)
    
    for call in history:
        if not call.get("caller_name"):
            caller = await get_collection("users").find_one(
                {"_id": ObjectId(call["caller_id"])},
                {"display_name": 1, "username": 1}
            )
            call["caller_name"] = caller.get("display_name") or caller.get("username") or "Pengguna" if caller else "Pengguna"
        
        if not call.get("callee_name"):
            callee = await get_collection("users").find_one(
                {"_id": ObjectId(call["callee_id"])},
                {"display_name": 1, "username": 1}
            )
            call["callee_name"] = callee.get("display_name") or callee.get("username") or "Pengguna" if callee else "Pengguna"
    
    return {"calls": history, "total": len(history)}


# ── Inisiasi Panggilan ────────────────────────────────────
@router.post("/initiate", summary="Mulai Panggilan")
async def initiate_call(
    request: InitiateCallRequest,
    current_user: dict = Depends(get_current_user),
):
    caller_id = str(current_user["_id"])

    # Validasi callee ada
    if not ObjectId.is_valid(request.callee_id):
        raise HTTPException(status_code=400, detail="ID penerima tidak valid")

    callee = await get_collection("users").find_one({"_id": ObjectId(request.callee_id)})
    if not callee:
        raise HTTPException(status_code=404, detail="Pengguna tidak ditemukan")

    # Cek apakah caller sendiri sedang dalam panggilan
    active_call = await CallService.get_active_call(caller_id)
    if active_call:
        raise HTTPException(status_code=409, detail="Anda sedang dalam panggilan lain")

    result = await CallService.initiate_call(
        caller_id=caller_id,
        callee_id=request.callee_id,
        chat_id=request.chat_id,
        call_type=request.type,
    )

    if not result["success"]:
        reason = result.get("reason", "unknown")
        if reason == "busy":
            raise HTTPException(status_code=409, detail="Pengguna sedang sibuk")
        raise HTTPException(status_code=500, detail="Gagal memulai panggilan")

    call_id = result["call_id"]
    caller_name = current_user.get("display_name", "Seseorang")

    # Kirim notifikasi ke callee via WebSocket (jika online)
    ws_sent = await manager.notify_incoming_call(
        callee_id=request.callee_id,
        call_id=call_id,
        caller_id=caller_id,
        call_type=request.type,
        chat_id=request.chat_id,
    )

    # Kirim push notification jika callee offline
    if not ws_sent:
        callee_token = callee.get("notification_token")
        if callee_token:
            await notification_svc.send_incoming_call_notification(
                device_token=callee_token,
                caller_name=caller_name,
                call_type=request.type,
                call_id=call_id,
                chat_id=request.chat_id,
            )

    # Update state ke ringing
    await CallService.update_call_state(call_id, CallState.RINGING)

    logger.info("📞 Panggilan %s dimulai oleh %s", call_id, caller_id)
    return {
        "call_id": call_id,
        "type": request.type,
        "state": CallState.RINGING,
        "callee_id": request.callee_id,
        "callee_name": callee.get("display_name"),
        "callee_avatar": callee.get("avatar_url"),
    }


# ── Jawab Panggilan ───────────────────────────────────────
@router.post("/{call_id}/answer", summary="Jawab Panggilan")
async def answer_call(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await CallService.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    if call_data["callee_id"] != user_id:
        raise HTTPException(status_code=403, detail="Bukan panggilan untuk Anda")

    if call_data["state"] not in (CallState.INITIATING, CallState.RINGING):
        raise HTTPException(status_code=409, detail="Panggilan tidak bisa dijawab")

    await CallService.update_call_state(call_id, CallState.ANSWERED)

    # Beritahu caller bahwa panggilan dijawab
    await manager.send_to_user(
        call_data["caller_id"],
        {
            "event": "call_answered",
            "call_id": call_id,
            "answerer_id": user_id,
        },
    )
    return {"call_id": call_id, "state": CallState.ANSWERED}


# ── Tolak Panggilan ───────────────────────────────────────
@router.post("/{call_id}/decline", summary="Tolak Panggilan")
async def decline_call(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await CallService.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    result = await CallService.end_call(call_id, ended_by=user_id)

    # Beritahu caller via WebSocket
    await manager.send_to_user(
        call_data["caller_id"],
        {"event": "call_declined", "call_id": call_id, "declined_by": user_id},
    )
    return {"call_id": call_id, "state": CallState.DECLINED}


# ── Akhiri Panggilan ──────────────────────────────────────
@router.post("/{call_id}/end", summary="Akhiri Panggilan")
async def end_call(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await CallService.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    if user_id not in call_data.get("participants", [user_id]):
        raise HTTPException(status_code=403, detail="Anda bukan peserta panggilan ini")

    result = await CallService.end_call(call_id, ended_by=user_id)
    if not result:
        raise HTTPException(status_code=500, detail="Gagal mengakhiri panggilan")

    # Beritahu semua peserta via WebSocket
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


# ── Info Panggilan ────────────────────────────────────────
@router.get("/{call_id}", summary="Info Panggilan")
async def get_call(
    call_id: str,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await CallService.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    if user_id not in (call_data.get("caller_id"), call_data.get("callee_id")):
        raise HTTPException(status_code=403, detail="Akses ditolak")

    return call_data


# ── WebRTC Signaling via REST (fallback jika WS putus) ────
@router.post("/{call_id}/signal", summary="Kirim Signaling WebRTC")
async def send_signal(
    call_id: str,
    signal: SignalingMessage,
    user_id: str = Depends(get_current_user_id),
):
    call_data = await CallService.get_call(call_id)
    if not call_data:
        raise HTTPException(status_code=404, detail="Panggilan tidak ditemukan")

    sent = await manager.send_signaling(
        target_user_id=signal.target_user_id,
        signal_data={
            "call_id": call_id,
            "type": signal.type,
            "sdp": signal.sdp,
            "candidate": signal.candidate,
            "from_user_id": user_id,
            "call_type": signal.call_type or call_data.get("type"),
        },
    )

    if not sent:
        raise HTTPException(
            status_code=503,
            detail="Target user tidak terhubung via WebSocket",
        )
    return {"success": True}
