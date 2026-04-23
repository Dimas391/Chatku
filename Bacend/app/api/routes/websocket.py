import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from typing import Optional

from app.core.security import decode_token
from app.core.database import get_collection
from app.core.redis_client import set_user_online, set_user_offline
from app.services.websocket_manager import manager
from app.services.chat_service import ChatService
from app.services.call_service import CallService
from app.models.call import SignalingType
from bson import ObjectId
from datetime import datetime, timezone

router = APIRouter(tags=["WebSocket"])
logger = logging.getLogger(__name__)


# ── Auth via query param ──────────────────────────────────
async def authenticate_websocket(token: str) -> Optional[dict]:
    """Validasi JWT token dari query param WebSocket."""
    try:
        payload = decode_token(token)
        if not payload or payload.get("type") != "access":
            return None
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
        return user if user and user.get("is_active") else None
    except Exception as e:
        logger.error(f"Error authenticating websocket: {e}")
        return None


# ── Main WebSocket Endpoint ───────────────────────────────
@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT access token"),
):
    # Log koneksi masuk
    client_host = websocket.client.host if websocket.client else "unknown"
    logger.info(f"🔌 WebSocket connection attempt from: {client_host}")
    
    # PERBAIKAN: JANGAN accept di sini! Biarkan manager.connect yang melakukan accept
    # await websocket.accept()  <- HAPUS BARIS INI
    
    # Autentikasi dulu
    user = await authenticate_websocket(token)
    if not user:
        logger.warning(f"❌ Authentication failed")
        await websocket.close(code=4001, reason="Token tidak valid")
        return

    user_id = str(user["_id"])
    display_name = user.get("display_name", "User")

    logger.info(f"✅ User {display_name} ({user_id}) authenticated")

    # Hubungkan ke manager (di sini akan dilakukan accept)
    await manager.connect(websocket, user_id)

    # Update status online
    await get_collection("users").update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_online": True, "updated_at": datetime.now(timezone.utc)}},
    )
    await set_user_online(user_id, user_id)
    await manager.notify_user_status(user_id, is_online=True)

    # Kirim konfirmasi
    await websocket.send_json({
        "event": "connected",
        "user_id": user_id,
        "display_name": display_name,
        "message": "Terhubung ke ChatKu WebSocket",
    })

    logger.info(f"✅ WebSocket: {display_name} ({user_id}) terhubung.")

    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            logger.info(f"📥 Received: {data}")
            
            # Handle messages...
            await _handle_message(websocket, user_id, data)
            
    except WebSocketDisconnect:
        logger.info(f"🔌 WebSocket: {display_name} ({user_id}) terputus.")
    except Exception as exc:
        logger.error(f"WS error ({user_id}): {exc}")
    finally:
        # Cleanup
        manager.disconnect(websocket, user_id)
        await get_collection("users").update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_online": False,
                    "last_seen": datetime.now(timezone.utc),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        await set_user_offline(user_id)


# ── Message Handler ───────────────────────────────────────
async def _handle_message(websocket: WebSocket, user_id: str, data: dict) -> None:
    """Proses pesan masuk dari WebSocket client."""
    event = data.get("event", "")
    payload = data.get("data", {})

    if event == "ping":
        await websocket.send_json({"event": "pong", "timestamp": datetime.now(timezone.utc).isoformat()})

    elif event == "join_chat":
        chat_id = payload.get("chat_id")
        if chat_id:
            chat = await ChatService.get_chat_by_id(chat_id, user_id)
            if chat:
                manager.join_chat(user_id, chat_id)
                await websocket.send_json({
                    "event": "joined_chat",
                    "chat_id": chat_id,
                })

    elif event == "leave_chat":
        chat_id = payload.get("chat_id")
        if chat_id:
            manager.leave_chat(user_id, chat_id)

    elif event == "typing":
        chat_id = payload.get("chat_id")
        is_typing = payload.get("is_typing", True)
        if chat_id:
            await manager.notify_typing(chat_id, user_id, is_typing)

    elif event == "read":
        chat_id = payload.get("chat_id")
        if chat_id:
            count = await ChatService.mark_messages_read(chat_id, user_id)
            if count > 0:
                await manager.notify_messages_read(chat_id, user_id)
    # ── WebRTC Signaling ──────────────────────────────────
    elif event == "webrtc_signal":
        await _handle_webrtc_signal(websocket, user_id, payload)

    else:
        await websocket.send_json({
            "event": "error",
            "message": f"Event tidak dikenal: {event}",
        })

# ── WebRTC Signal Handler ─────────────────────────────────
async def _handle_webrtc_signal(
    websocket: WebSocket, user_id: str, payload: dict
) -> None:
    """
    Proses sinyal WebRTC dan teruskan ke target user.

    Supported signal types:
    - offer        : SDP offer dari caller ke callee
    - answer       : SDP answer dari callee ke caller
    - ice-candidate: ICE candidate untuk NAT traversal
    - end-call     : Akhiri panggilan
    - decline-call : Tolak panggilan
    - mute-audio   : Mute mikrofon (notifikasi ke peer)
    - unmute-audio : Unmute mikrofon
    - toggle-video : Toggle kamera on/off
    - busy         : User sedang sibuk
    """
    signal_type = payload.get("type")
    target_user_id = payload.get("target_user_id")
    call_id = payload.get("call_id")

    if not signal_type or not target_user_id:
        await websocket.send_json({
            "event": "error",
            "message": "signal type dan target_user_id wajib diisi",
        })
        return

    # Teruskan sinyal ke target user
    signal_data = {
        "call_id": call_id,
        "type": signal_type,
        "from_user_id": user_id,
        "target_user_id": target_user_id,
    }

    # Sertakan SDP atau ICE candidate
    if payload.get("sdp"):
        signal_data["sdp"] = payload["sdp"]
    if payload.get("candidate"):
        signal_data["candidate"] = payload["candidate"]
    if payload.get("call_type"):
        signal_data["call_type"] = payload["call_type"]

    sent = await manager.send_signaling(target_user_id, signal_data)

    # Handle khusus end-call dan decline
    if signal_type in (SignalingType.END_CALL, SignalingType.DECLINE_CALL) and call_id:
        await CallService.end_call(call_id, ended_by=user_id)

    if not sent:
        await websocket.send_json({
            "event": "signal_failed",
            "reason": "target_offline",
            "target_user_id": target_user_id,
        })


# ── WebSocket khusus Call (opsional, lebih terstruktur) ───
@router.websocket("/ws/call/{call_id}")
async def call_websocket(
    call_id: str,
    websocket: WebSocket,
    token: str = Query(...),
):
    """
    WebSocket khusus untuk satu sesi panggilan.
    Memudahkan isolasi sinyal per panggilan.
    """
    user = await authenticate_websocket(token)
    if not user:
        await websocket.close(code=4001, reason="Token tidak valid")
        return

    user_id = str(user["_id"])

    # Verifikasi user adalah peserta panggilan
    call_data = await CallService.get_call(call_id)
    if not call_data:
        await websocket.close(code=4004, reason="Panggilan tidak ditemukan")
        return

    participants = [call_data.get("caller_id"), call_data.get("callee_id")]
    if user_id not in participants:
        await websocket.close(code=4003, reason="Anda bukan peserta panggilan ini")
        return

    await manager.connect(websocket, user_id)
    await websocket.send_json({
        "event": "call_connected",
        "call_id": call_id,
        "call_type": call_data.get("type"),
        "ice_servers": [
            {"urls": s.urls, "username": s.username, "credential": s.credential}
            for s in CallService.get_ice_servers()
        ],
    })

    logger.info(" WS Call: user %s bergabung ke call %s", user_id, call_id)

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                data = json.loads(raw)
            except json.JSONDecodeError:
                continue

            signal_type = data.get("type")
            target_id = data.get("target_user_id")

            if not signal_type or not target_id:
                continue

            # Teruskan sinyal ke peer
            await manager.send_signaling(
                target_user_id=target_id,
                signal_data={
                    "call_id": call_id,
                    "type": signal_type,
                    "from_user_id": user_id,
                    "sdp": data.get("sdp"),
                    "candidate": data.get("candidate"),
                    "call_type": call_data.get("type"),
                },
            )

            # Handle akhir panggilan
            if signal_type in (SignalingType.END_CALL, SignalingType.DECLINE_CALL):
                break

    except WebSocketDisconnect:
        logger.info(" WS Call: user %s terputus dari call %s", user_id, call_id)
    finally:
        manager.disconnect(websocket, user_id)
