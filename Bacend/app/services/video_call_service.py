import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List, Dict

from bson import ObjectId

from app.core.database import get_collection
from app.core.redis_client import cache_set, cache_get, cache_delete
from app.models.video_call import (
    VideoCallDocument,
    VideoCallType,
    VideoCallState,
    VideoCallResponse,
)
from app.models.chat import MessageDocument, MessageType, CallStatus

logger = logging.getLogger(__name__)

CALL_SESSION_TTL = 1800  # 30 menit


class VideoCallService:
    """Layanan manajemen panggilan video."""

    @staticmethod
    async def initiate_video_call(
        caller_id: str,
        callee_id: str,
        chat_id: str,
    ) -> Dict:
        """Inisiasi panggilan video baru."""
        # Cek apakah callee sedang dalam panggilan
        active = await VideoCallService.get_active_call(callee_id)
        if active:
            return {"success": False, "reason": "busy", "call_id": None}

        call_id = str(uuid.uuid4())

        # Simpan ke MongoDB
        call_doc = VideoCallDocument(
            call_id=call_id,
            chat_id=chat_id,
            caller_id=caller_id,
            callee_id=callee_id,
            participants=[caller_id, callee_id],
            type=VideoCallType.VIDEO,
            state=VideoCallState.INITIATING,
        )
        result = await get_collection("video_calls").insert_one(
            call_doc.model_dump(by_alias=True, exclude={"id"})
        )

        # Simpan ke Redis
        call_data = {
            "call_id": call_id,
            "chat_id": chat_id,
            "caller_id": caller_id,
            "callee_id": callee_id,
            "type": "video",
            "state": VideoCallState.INITIATING,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "db_id": str(result.inserted_id),
        }
        await cache_set(f"video_call:{call_id}", call_data, CALL_SESSION_TTL)
        await cache_set(f"user_video_call:{caller_id}", call_id, CALL_SESSION_TTL)
        await cache_set(f"user_video_call:{callee_id}", call_id, CALL_SESSION_TTL)

        logger.info(f"📹 Video call {call_id} initiated by {caller_id} to {callee_id}")
        return {"success": True, "call_id": call_id, "call_data": call_data}

    @staticmethod
    async def update_call_state(call_id: str, new_state: VideoCallState) -> bool:
        """Update state panggilan video."""
        call_data = await cache_get(f"video_call:{call_id}")
        if not call_data:
            return False

        call_data["state"] = new_state
        now = datetime.now(timezone.utc)

        if new_state == VideoCallState.ANSWERED:
            call_data["answered_at"] = now.isoformat()
        elif new_state in (VideoCallState.ENDED, VideoCallState.MISSED, VideoCallState.DECLINED):
            call_data["ended_at"] = now.isoformat()

        await cache_set(f"video_call:{call_id}", call_data, CALL_SESSION_TTL)

        # Update MongoDB
        update_fields = {"state": new_state, "updated_at": now}
        if new_state == VideoCallState.ANSWERED:
            update_fields["answered_at"] = now
        elif new_state in (VideoCallState.ENDED, VideoCallState.MISSED, VideoCallState.DECLINED):
            update_fields["ended_at"] = now
            if "answered_at" in call_data and call_data["answered_at"]:
                answered = datetime.fromisoformat(call_data["answered_at"])
                duration = int((now - answered).total_seconds())
                update_fields["duration_seconds"] = duration
                call_data["duration_seconds"] = duration

        await get_collection("video_calls").update_one(
            {"call_id": call_id},
            {"$set": update_fields},
        )
        return True

    @staticmethod
    async def end_call(call_id: str, ended_by: str) -> Optional[Dict]:
        """Akhiri panggilan video."""
        call_data = await cache_get(f"video_call:{call_id}")
        if not call_data:
            call_doc = await get_collection("video_calls").find_one({"call_id": call_id})
            if not call_doc:
                return None
            call_data = {
                "call_id": call_id,
                "chat_id": str(call_doc["chat_id"]),
                "caller_id": call_doc["caller_id"],
                "callee_id": call_doc["callee_id"],
                "type": "video",
                "state": call_doc["state"],
            }

        current_state = call_data.get("state")
        if current_state == VideoCallState.ANSWERED:
            final_state = VideoCallState.ENDED
        elif current_state == VideoCallState.RINGING:
            final_state = VideoCallState.DECLINED if ended_by == call_data["callee_id"] else VideoCallState.MISSED
        else:
            final_state = VideoCallState.ENDED

        await VideoCallService.update_call_state(call_id, final_state)
        call_data["state"] = final_state

        duration = call_data.get("duration_seconds")
        if final_state == VideoCallState.ENDED:
            call_status = CallStatus.ANSWERED
        elif final_state == VideoCallState.DECLINED:
            call_status = CallStatus.DECLINED
        else:
            call_status = CallStatus.MISSED

        # Simpan log panggilan video ke chat
        msg = MessageDocument(
            chat_id=call_data["chat_id"],
            sender_id=call_data["caller_id"],
            type=MessageType.CALL_LOG,
            call_status=call_status,
            call_type="video",
            call_duration=duration,
        )
        await get_collection("messages").insert_one(
            msg.model_dump(by_alias=True, exclude={"id"})
        )

        await cache_delete(f"video_call:{call_id}")
        await cache_delete(f"user_video_call:{call_data['caller_id']}")
        await cache_delete(f"user_video_call:{call_data['callee_id']}")

        logger.info(f"Video call {call_id} ended with state: {final_state}")
        return call_data

    @staticmethod
    async def get_call(call_id: str) -> Optional[Dict]:
        """Ambil data panggilan video."""
        data = await cache_get(f"video_call:{call_id}")
        if data:
            return data
        doc = await get_collection("video_calls").find_one({"call_id": call_id})
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
        """Cek apakah user sedang dalam panggilan video aktif."""
        return await cache_get(f"user_video_call:{user_id}")

    @staticmethod
    async def get_call_history(user_id: str, skip: int = 0, limit: int = 20) -> List[Dict]:
        """Ambil riwayat panggilan video user."""
        cursor = (
            get_collection("video_calls")
            .find({"participants": user_id})
            .sort("created_at", -1)
            .skip(skip)
            .limit(limit)
        )
        docs = await cursor.to_list(length=limit)
        return [
            {
                "call_id": d["call_id"],
                "chat_id": d["chat_id"],
                "caller_id": d["caller_id"],
                "callee_id": d["callee_id"],
                "type": d["type"],
                "state": d["state"],
                "duration_seconds": d.get("duration_seconds"),
                "created_at": d["created_at"].isoformat(),
            }
            for d in docs
        ]


video_call_service = VideoCallService()