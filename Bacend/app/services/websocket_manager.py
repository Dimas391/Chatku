# app/services/websocket_manager.py
import json
import logging
from typing import Dict, Set, Optional
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """
    Manajemen koneksi WebSocket aktif.
    """

    def __init__(self):
        # user_id -> set of WebSocket
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # chat_id -> set of user_id
        self.chat_rooms: Dict[str, Set[str]] = {}

    # ── Lifecycle ─────────────────────────────────────────
    async def connect(self, websocket: WebSocket, user_id: str) -> None:
        """Terima koneksi WebSocket baru dari user."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.info(f"🔌 User {user_id} terhubung. Total koneksi aktif: {self._total_connections()}")

    def disconnect(self, websocket: WebSocket, user_id: str) -> None:
        """Putus koneksi WebSocket."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"🔌 User {user_id} terputus. Total koneksi aktif: {self._total_connections()}")

    # ── Join / Leave Room ─────────────────────────────────
    def join_chat(self, user_id: str, chat_id: str) -> None:
        """User bergabung ke chat room."""
        if chat_id not in self.chat_rooms:
            self.chat_rooms[chat_id] = set()
        self.chat_rooms[chat_id].add(user_id)

    def leave_chat(self, user_id: str, chat_id: str) -> None:
        """User meninggalkan chat room."""
        if chat_id in self.chat_rooms:
            self.chat_rooms[chat_id].discard(user_id)
            if not self.chat_rooms[chat_id]:
                del self.chat_rooms[chat_id]

    # ── Send to User ──────────────────────────────────────
    async def send_to_user(self, user_id: str, data: dict) -> bool:
        """Kirim pesan ke semua WebSocket aktif milik user_id."""
        if user_id not in self.active_connections:
            return False
        
        message = json.dumps(data)
        disconnected = set()
        
        for ws in self.active_connections[user_id].copy():
            try:
                await ws.send_text(message)
            except Exception:
                disconnected.add(ws)
        
        for ws in disconnected:
            self.active_connections[user_id].discard(ws)
        
        return True

    # ── Broadcast ke Chat Room ────────────────────────────
    async def broadcast_to_chat(
        self, chat_id: str, data: dict, exclude_user_id: Optional[str] = None
    ) -> None:
        """Kirim pesan ke semua user aktif dalam chat room."""
        if chat_id not in self.chat_rooms:
            return
        
        users = self.chat_rooms[chat_id].copy()
        
        for user_id in users:
            if user_id == exclude_user_id:
                continue
            await self.send_to_user(user_id, data)

    # ── WebRTC Signaling ──────────────────────────────────
    async def send_signaling(
        self, target_user_id: str, signal_data: dict
    ) -> bool:
        """Kirim pesan signaling WebRTC ke user tertentu."""
        return await self.send_to_user(target_user_id, {
            "event": "webrtc_signal",
            "data": signal_data,
        })

    # ── Event-based helpers ───────────────────────────────
    async def notify_new_message(
        self, chat_id: str, message: dict, sender_id: str
    ) -> None:
        """Broadcast pesan baru ke semua peserta chat (kecuali pengirim)."""
        await self.broadcast_to_chat(
            chat_id=chat_id,
            data={"event": "new_message", "data": message},
            exclude_user_id=sender_id,
        )

    async def notify_typing(
        self, chat_id: str, user_id: str, is_typing: bool
    ) -> None:
        """Broadcast status mengetik."""
        await self.broadcast_to_chat(
            chat_id=chat_id,
            data={
                "event": "typing",
                "data": {
                    "chat_id": chat_id,
                    "user_id": user_id,
                    "is_typing": is_typing,
                },
            },
            exclude_user_id=user_id,
        )

    async def notify_messages_read(
        self, chat_id: str, reader_id: str
    ) -> None:
        """Beritahu pengirim bahwa pesannya sudah dibaca."""
        await self.broadcast_to_chat(
            chat_id=chat_id,
            data={
                "event": "messages_read",
                "data": {"reader_id": reader_id, "chat_id": chat_id},
            },
            exclude_user_id=reader_id,
        )

    async def notify_user_status(self, user_id: str, is_online: bool) -> None:
        """Broadcast perubahan status online user ke kontaknya."""
        for uid in list(self.active_connections.keys()):
            await self.send_to_user(uid, {
                "event": "user_status_changed",
                "data": {"user_id": user_id, "is_online": is_online},
            })

    async def notify_profile_updated(self, user_id: str, profile_data: dict) -> None:
        """Broadcast perubahan profil user ke semua user aktif."""
        for uid in list(self.active_connections.keys()):
            await self.send_to_user(uid, {
                "event": "profile_updated",
                "data": {
                    "user_id": user_id,
                    **profile_data
                },
            })

    async def notify_incoming_call(
        self,
        callee_id: str,
        call_id: str,
        caller_id: str,
        call_type: str,
        chat_id: str,
    ) -> bool:
        """Kirim notifikasi panggilan masuk via WebSocket."""
        from app.core.database import get_collection
        from bson import ObjectId

        caller_name = "Pengguna"
        caller_avatar = ""
        try:
            if ObjectId.is_valid(caller_id):
                caller = await get_collection("users").find_one({"_id": ObjectId(caller_id)})
                if caller:
                    caller_name = caller.get("display_name") or caller.get("username") or "Pengguna"
                    caller_avatar = caller.get("avatar_url") or ""
        except Exception as e:
            logger.warning(f"Gagal ambil info caller: {e}")

        print(f"Sending incoming_call to {callee_id}: call_id={call_id}, caller={caller_name}")
        
        sent = await self.send_to_user(
            callee_id,
            {
                "event": "incoming_call",
                "data": {
                    "call_id": call_id,
                    "caller_id": caller_id,
                    "caller_name": caller_name,
                    "caller_avatar": caller_avatar,
                    "chat_id": chat_id,
                    "type": call_type,
                },
            },
        )
        
        print(f"incoming_call sent: {sent}")
        return sent

    # ── Status ────────────────────────────────────────────
    def is_online(self, user_id: str) -> bool:
        return (
            user_id in self.active_connections
            and bool(self.active_connections[user_id])
        )

    def _total_connections(self) -> int:
        return sum(len(sockets) for sockets in self.active_connections.values())

    def get_online_user_ids(self) -> list:
        return list(self.active_connections.keys())


# ── Singleton instance ────────────────────────────────────
manager = ConnectionManager()