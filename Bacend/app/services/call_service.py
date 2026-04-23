import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict

from bson import ObjectId # type: ignore

from app.core.database import get_collection
from app.core.config import settings
from app.core.redis_client import cache_set, cache_get, cache_delete
from app.models.call import (
    CallDocument,
    CallType,
    CallState,
    ICEServerConfig,
)
from app.models.chat import MessageDocument, MessageType, CallStatus

logger = logging.getLogger(__name__)

# TTL sesi call aktif di Redis (30 menit)
CALL_SESSION_TTL = 1800


class CallService:
    """Layanan manajemen panggilan suara dan video."""

    # ── Inisiasi Panggilan ────────────────────────────────
    @staticmethod
    async def initiate_call(
        caller_id: str,
        callee_id: str,
        chat_id: str,
        call_type: CallType = CallType.AUDIO,
    ) -> Dict:
        """
        Inisiasi panggilan baru.
        Returns dict dengan call_id dan informasi call.
        """
        # Cek apakah callee sedang dalam panggilan
        active = await CallService.get_active_call(callee_id)
        if active:
            return {"success": False, "reason": "busy", "call_id": None}

        call_id = str(uuid.uuid4())

        # Simpan ke MongoDB
        call_doc = CallDocument(
            call_id=call_id,
            chat_id=chat_id,
            caller_id=caller_id,
            callee_id=callee_id,
            participants=[caller_id, callee_id],
            type=call_type,
            state=CallState.INITIATING,
        )
        result = await get_collection("calls").insert_one(
            call_doc.model_dump(by_alias=True, exclude={"id"})
        )

        # Simpan ke Redis untuk akses cepat
        call_data = {
            "call_id": call_id,
            "chat_id": chat_id,
            "caller_id": caller_id,
            "callee_id": callee_id,
            "type": call_type,
            "state": CallState.INITIATING,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "db_id": str(result.inserted_id),
        }
        await cache_set(f"call:{call_id}", call_data, CALL_SESSION_TTL)
        await cache_set(f"user_call:{caller_id}", call_id, CALL_SESSION_TTL)
        await cache_set(f"user_call:{callee_id}", call_id, CALL_SESSION_TTL)

        logger.info(" Panggilan %s dimulai oleh %s ke %s", call_id, caller_id, callee_id)
        return {"success": True, "call_id": call_id, "call_data": call_data}

    # ── Update State Panggilan ────────────────────────────
    @staticmethod
    async def update_call_state(call_id: str, new_state: CallState) -> bool:
        """Update state panggilan di Redis dan MongoDB."""
        call_data = await cache_get(f"call:{call_id}")
        if not call_data:
            return False

        call_data["state"] = new_state
        now = datetime.now(timezone.utc)

        if new_state == CallState.ANSWERED:
            call_data["answered_at"] = now.isoformat()
        elif new_state in (CallState.ENDED, CallState.MISSED, CallState.DECLINED, CallState.FAILED):
            call_data["ended_at"] = now.isoformat()

        await cache_set(f"call:{call_id}", call_data, CALL_SESSION_TTL)

        # Update MongoDB
        update_fields: dict = {
            "state": new_state,
            "updated_at": now,
        }
        if new_state == CallState.ANSWERED:
            update_fields["answered_at"] = now
        elif new_state in (CallState.ENDED, CallState.MISSED, CallState.DECLINED):
            update_fields["ended_at"] = now
            # Hitung durasi
            if "answered_at" in call_data and call_data["answered_at"]:
                answered = datetime.fromisoformat(call_data["answered_at"])
                duration = int((now - answered).total_seconds())
                update_fields["duration_seconds"] = duration
                call_data["duration_seconds"] = duration

        await get_collection("calls").update_one(
            {"call_id": call_id},
            {"$set": update_fields},
        )
        return True

    @staticmethod
    async def end_call(call_id: str, ended_by: str) -> Optional[Dict]:
        """
        Akhiri panggilan dan simpan log ke pesan chat.
        Returns call data untuk dikirim via WebSocket.
        """
        call_data = await cache_get(f"call:{call_id}")
        if not call_data:
            # Coba dari MongoDB
            call_doc = await get_collection("calls").find_one({"call_id": call_id})
            if not call_doc:
                return None
            call_data = {
                "call_id": call_id,
                "chat_id": str(call_doc["chat_id"]),
                "caller_id": call_doc["caller_id"],
                "callee_id": call_doc["callee_id"],
                "type": call_doc["type"],
                "state": call_doc["state"],
            }

        current_state = call_data.get("state")
        if current_state == CallState.ANSWERED:
            final_state = CallState.ENDED
        elif current_state == CallState.RINGING:
            # Jika yang menutup adalah callee = declined, jika caller = missed
            final_state = (
                CallState.DECLINED
                if ended_by == call_data["callee_id"]
                else CallState.MISSED
            )
        else:
            final_state = CallState.ENDED

        await CallService.update_call_state(call_id, final_state)
        call_data["state"] = final_state

        # Tentukan call status untuk log pesan
        duration = call_data.get("duration_seconds")
        if final_state == CallState.ENDED:
            call_status = CallStatus.ANSWERED
        elif final_state == CallState.DECLINED:
            call_status = CallStatus.DECLINED
        else:
            call_status = CallStatus.MISSED

        # Simpan log panggilan sebagai pesan di chat
        await CallService._save_call_log(
            chat_id=call_data["chat_id"],
            sender_id=call_data["caller_id"],
            call_type=call_data["type"],
            call_status=call_status,
            duration=duration,
        )

        # Bersihkan Redis
        await cache_delete(f"call:{call_id}")
        await cache_delete(f"user_call:{call_data['caller_id']}")
        await cache_delete(f"user_call:{call_data['callee_id']}")

        logger.info("Panggilan %s berakhir dengan state: %s", call_id, final_state)
        return call_data

    # ── Ambil Info Panggilan ──────────────────────────────
    @staticmethod
    async def get_call(call_id: str) -> Optional[Dict]:
        """Ambil data panggilan dari Redis atau MongoDB."""
        data = await cache_get(f"call:{call_id}")
        if data:
            return data
        doc = await get_collection("calls").find_one({"call_id": call_id})
        if doc:
            return {
                "call_id": doc["call_id"],
                "chat_id": doc["chat_id"],
                "caller_id": doc["caller_id"],
                "callee_id": doc["callee_id"],
                "type": doc["type"],
                "state": doc["state"],
            }
        return None

    @staticmethod
    async def get_active_call(user_id: str) -> Optional[str]:
        """Cek apakah user sedang dalam panggilan aktif. Return call_id atau None."""
        return await cache_get(f"user_call:{user_id}")

    @staticmethod
    async def get_call_history(
        user_id: str, skip: int = 0, limit: int = 20
    ) -> List[Dict]:
        """Ambil riwayat panggilan user."""
        cursor = (
            get_collection("calls")
            .find({"participants": user_id})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)
        
        result = []
        for doc in docs:
            # Pastikan created_at dikirim
            created_at = doc.get("created_at")
            if created_at:
                if hasattr(created_at, 'isoformat'):
                    created_at_str = created_at.isoformat()
                else:
                    created_at_str = str(created_at)
            else:
                # Fallback ke started_at atau sekarang
                started_at = doc.get("started_at")
                if started_at:
                    if hasattr(started_at, 'isoformat'):
                        created_at_str = started_at.isoformat()
                    else:
                        created_at_str = str(started_at)
                else:
                    created_at_str = datetime.now(timezone.utc).isoformat()
            
            result.append({
                "call_id": doc["call_id"],
                "chat_id": doc["chat_id"],
                "caller_id": doc["caller_id"],
                "callee_id": doc["callee_id"],
                "type": doc["type"],
                "state": doc["state"],
                "duration_seconds": doc.get("duration_seconds"),
                "created_at": created_at_str,  # Wajib ada!
            })
        
        return result

    # ── ICE Server Config ─────────────────────────────────
    @staticmethod
    def get_ice_servers() -> List[ICEServerConfig]:
        """
        Kembalikan konfigurasi STUN/TURN server untuk WebRTC.
        Tambahkan TURN server berbayar untuk produksi yang lebih stabil.
        """
        servers = [
            ICEServerConfig(urls=["stun:stun.l.google.com:19302"]),
            ICEServerConfig(urls=["stun:stun1.l.google.com:19302"]),
            ICEServerConfig(urls=["stun:stun2.l.google.com:19302"]),
            ICEServerConfig(urls=["stun:stun3.l.google.com:19302"]),
            ICEServerConfig(urls=["stun:stun4.l.google.com:19302"]),
        ]
        if settings.TURN_SERVER_URL and settings.TURN_USERNAME:
            servers.append(
                ICEServerConfig(
                    urls=[settings.TURN_SERVER_URL],
                    username=settings.TURN_USERNAME,
                    credential=settings.TURN_PASSWORD,
                )
            )
        return servers

    # ── Private Helpers ───────────────────────────────────
    @staticmethod
    async def _save_call_log(
        chat_id: str,
        sender_id: str,
        call_type: str,
        call_status: CallStatus,
        duration: Optional[int],
    ) -> None:
        """Simpan log panggilan sebagai pesan khusus di chat."""
        msg = MessageDocument(
            chat_id=chat_id,
            sender_id=sender_id,
            type=MessageType.CALL_LOG,
            call_status=call_status,
            call_type=call_type,
            call_duration=duration,
        )
        await get_collection("messages").insert_one(
            msg.model_dump(by_alias=True, exclude={"id"})
        )