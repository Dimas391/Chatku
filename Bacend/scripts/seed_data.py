import asyncio
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient # type: ignore
from bson import ObjectId # type: ignore

MONGODB_URL = os.getenv("mongodb+srv://dimaskurniawan12212_db_user:1wc8jfeO07xBZgNG@cluster0.1s0itv2.mongodb.net/Safe_Chat?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = os.getenv("MONGODB_DB_NAME", "Safe_Chat")

# ── Data Dummy ────────────────────────────────────────────
USERS = [
    {
        "_id": ObjectId("000000000000000000000001"),
        "username": "budi_santoso",
        "display_name": "Budi Santoso",
        "phone": "081111111111",
        "avatar_url": "https://ui-avatars.com/api/?name=Budi+Santoso&background=FF6B35&color=fff",
        "bio": "Halo! Saya pakai ChatKu.",
        "is_active": True,
        "is_verified": True,
        "is_online": False,
        "contacts": ["000000000000000000000002", "000000000000000000000003"],
        "blocked_users": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_seen": datetime.now(timezone.utc),
    },
    {
        "_id": ObjectId("000000000000000000000002"),
        "username": "siti_rahayu",
        "display_name": "Siti Rahayu",
        "phone": "082222222222",
        "avatar_url": "https://ui-avatars.com/api/?name=Siti+Rahayu&background=FF8C5A&color=fff",
        "bio": "Designer & coffee lover ☕",
        "is_active": True,
        "is_verified": True,
        "is_online": False,
        "contacts": ["000000000000000000000001"],
        "blocked_users": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_seen": datetime.now(timezone.utc),
    },
    {
        "_id": ObjectId("000000000000000000000003"),
        "username": "agus_wijaya",
        "display_name": "Agus Wijaya",
        "phone": "083333333333",
        "avatar_url": "https://ui-avatars.com/api/?name=Agus+Wijaya&background=4CAF50&color=fff",
        "bio": "Backend developer | Python enthusiast",
        "is_active": True,
        "is_verified": True,
        "is_online": False,
        "contacts": ["000000000000000000000001", "000000000000000000000004"],
        "blocked_users": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_seen": datetime.now(timezone.utc),
    },
    {
        "_id": ObjectId("000000000000000000000004"),
        "username": "dewi_lestari",
        "display_name": "Dewi Lestari",
        "phone": "084444444444",
        "avatar_url": "https://ui-avatars.com/api/?name=Dewi+Lestari&background=9C27B0&color=fff",
        "bio": "Mobile developer | React Native",
        "is_active": True,
        "is_verified": True,
        "is_online": False,
        "contacts": ["000000000000000000000003"],
        "blocked_users": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_seen": datetime.now(timezone.utc),
    },
    {
        "_id": ObjectId("000000000000000000000005"),
        "username": "rizki_pratama",
        "display_name": "Rizki Pratama",
        "phone": "085555555555",
        "avatar_url": "https://ui-avatars.com/api/?name=Rizki+Pratama&background=2196F3&color=fff",
        "bio": "Full stack dev | Ngopi dulu",
        "is_active": True,
        "is_verified": True,
        "is_online": False,
        "contacts": [],
        "blocked_users": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
        "last_seen": datetime.now(timezone.utc),
    },
]

CHATS = [
    # Personal chat: Budi ↔ Siti
    {
        "_id": ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa"),
        "type": "personal",
        "name": None,
        "participants": ["000000000000000000000001", "000000000000000000000002"],
        "admins": [],
        "created_by": "000000000000000000000001",
        "last_message_text": "Iya, besok ya!",
        "last_message_at": datetime.now(timezone.utc),
        "last_message_by": "000000000000000000000002",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    # Personal chat: Budi ↔ Agus
    {
        "_id": ObjectId("bbbbbbbbbbbbbbbbbbbbbbbb"),
        "type": "personal",
        "name": None,
        "participants": ["000000000000000000000001", "000000000000000000000003"],
        "admins": [],
        "created_by": "000000000000000000000001",
        "last_message_text": "Code-nya sudah di-push ya",
        "last_message_at": datetime.now(timezone.utc),
        "last_message_by": "000000000000000000000003",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    # Grup: Tim Dev ChatKu
    {
        "_id": ObjectId("cccccccccccccccccccccccc"),
        "type": "group",
        "name": "Tim Dev ChatKu",
        "description": "Diskusi development aplikasi ChatKu",
        "avatar_url": "https://ui-avatars.com/api/?name=Tim+Dev&background=FF6B35&color=fff",
        "participants": [
            "000000000000000000000001",
            "000000000000000000000002",
            "000000000000000000000003",
            "000000000000000000000004",
        ],
        "admins": ["000000000000000000000001"],
        "created_by": "000000000000000000000001",
        "last_message_text": "Meeting jam 10 pagi ya semua!",
        "last_message_at": datetime.now(timezone.utc),
        "last_message_by": "000000000000000000000001",
        "is_active": True,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
]

MESSAGES = [
    # ── Chat Budi ↔ Siti ─────────────────────────────────
    {
        "chat_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
        "sender_id": "000000000000000000000001",
        "type": "text",
        "content": "Hei Siti, gimana kabar?",
        "is_deleted": False,
        "status": "read",
        "read_by": ["000000000000000000000002"],
        "delivered_to": ["000000000000000000000002"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "chat_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
        "sender_id": "000000000000000000000002",
        "type": "text",
        "content": "Alhamdulillah baik, kamu?",
        "is_deleted": False,
        "status": "read",
        "read_by": ["000000000000000000000001"],
        "delivered_to": ["000000000000000000000001"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "chat_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
        "sender_id": "000000000000000000000001",
        "type": "text",
        "content": "Baik juga. Besok kita meeting jam berapa?",
        "is_deleted": False,
        "status": "read",
        "read_by": ["000000000000000000000002"],
        "delivered_to": ["000000000000000000000002"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "chat_id": "aaaaaaaaaaaaaaaaaaaaaaaa",
        "sender_id": "000000000000000000000002",
        "type": "text",
        "content": "Iya, besok ya!",
        "is_deleted": False,
        "status": "delivered",
        "read_by": [],
        "delivered_to": ["000000000000000000000001"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },

    # ── Chat Budi ↔ Agus ─────────────────────────────────
    {
        "chat_id": "bbbbbbbbbbbbbbbbbbbbbbbb",
        "sender_id": "000000000000000000000003",
        "type": "text",
        "content": "Bud, backend WebSocket-nya sudah selesai",
        "is_deleted": False,
        "status": "read",
        "read_by": ["000000000000000000000001"],
        "delivered_to": ["000000000000000000000001"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "chat_id": "bbbbbbbbbbbbbbbbbbbbbbbb",
        "sender_id": "000000000000000000000001",
        "type": "text",
        "content": "Mantap! PR-nya sudah di-approve belum?",
        "is_deleted": False,
        "status": "read",
        "read_by": ["000000000000000000000003"],
        "delivered_to": ["000000000000000000000003"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "chat_id": "bbbbbbbbbbbbbbbbbbbbbbbb",
        "sender_id": "000000000000000000000003",
        "type": "text",
        "content": "Code-nya sudah di-push ya",
        "is_deleted": False,
        "status": "sent",
        "read_by": [],
        "delivered_to": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },

    # ── Grup Tim Dev ──────────────────────────────────────
    {
        "chat_id": "cccccccccccccccccccccccc",
        "sender_id": "000000000000000000000001",
        "type": "system",
        "content": "Grup Tim Dev ChatKu dibuat",
        "is_deleted": False,
        "status": "read",
        "read_by": ["000000000000000000000002", "000000000000000000000003", "000000000000000000000004"],
        "delivered_to": ["000000000000000000000002", "000000000000000000000003", "000000000000000000000004"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "chat_id": "cccccccccccccccccccccccc",
        "sender_id": "000000000000000000000003",
        "type": "text",
        "content": "Siap! Mari kita mulai sprint pertama 🚀",
        "is_deleted": False,
        "status": "read",
        "read_by": ["000000000000000000000001", "000000000000000000000002", "000000000000000000000004"],
        "delivered_to": ["000000000000000000000001", "000000000000000000000002", "000000000000000000000004"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "chat_id": "cccccccccccccccccccccccc",
        "sender_id": "000000000000000000000004",
        "type": "text",
        "content": "UI ChatKu sudah hampir selesai, tinggal integrasi API",
        "is_deleted": False,
        "status": "read",
        "read_by": ["000000000000000000000001", "000000000000000000000002", "000000000000000000000003"],
        "delivered_to": ["000000000000000000000001", "000000000000000000000002", "000000000000000000000003"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
    {
        "chat_id": "cccccccccccccccccccccccc",
        "sender_id": "000000000000000000000001",
        "type": "text",
        "content": "Meeting jam 10 pagi ya semua!",
        "is_deleted": False,
        "status": "delivered",
        "read_by": [],
        "delivered_to": ["000000000000000000000002", "000000000000000000000003", "000000000000000000000004"],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    },
]


async def seed():
    """Jalankan proses seeding data."""
    print(f"Menghubungkan ke MongoDB: {MONGODB_URL}")
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    try:
        # Bersihkan data lama
        print("Membersihkan data lama...")
        await db.users.delete_many({})
        await db.chats.delete_many({})
        await db.messages.delete_many({})
        await db.notifications.delete_many({})
        await db.calls.delete_many({})

        # Insert users
        print(f"👥 Menyisipkan {len(USERS)} user...")
        await db.users.insert_many(USERS)
        for u in USERS:
            print(f"   {u['display_name']} — {u['phone']}")

        # Insert chats
        print(f"Menyisipkan {len(CHATS)} chat room...")
        await db.chats.insert_many(CHATS)

        # Insert messages
        print(f"Menyisipkan {len(MESSAGES)} pesan...")
        await db.messages.insert_many(MESSAGES)

        print("\n Seed data selesai!")
        print("=" * 50)
        print("Test OTP dengan nomor berikut (kode: 123456):")
        for u in USERS:
            print(f"   {u['display_name']}: {u['phone']}")
        print("=" * 50)
        print(f"Dokumentasi API: http://:8000/docs")

    finally:
        client.close()


if __name__ == "__main__":
    asyncio.run(seed())
