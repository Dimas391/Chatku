import asyncio
import argparse
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient # type: ignore
from bson import ObjectId # type: ignore

MONGODB_URL = os.getenv("mongodb+srv://dimaskurniawan12212_db_user:1wc8jfeO07xBZgNG@cluster0.1s0itv2.mongodb.net/Safe_Chat?retryWrites=true&w=majority&appName=Cluster0")
DB_NAME = os.getenv("MONGODB_DB_NAME", "Safe_Chat")

async def create_admin(phone: str = None, email: str = None) -> None:
    """Buat atau update user admin."""
    if not phone and not email:
        print("Error: Harus menyertakan --phone atau --email")
        sys.exit(1)

    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]

    try:
        query = {}
        if phone:
            query = {"phone": phone}
        elif email:
            query = {"email": email}

        existing = await db.users.find_one(query)

        admin_data = {
            "username": f"admin_{phone or email.split('@')[0]}",
            "display_name": "Administrator",
            "phone": phone,
            "email": email,
            "is_active": True,
            "is_verified": True,
            "is_online": False,
            "role": "admin",           # custom field untuk admin
            "contacts": [],
            "blocked_users": [],
            "bio": "ChatKu Administrator",
            "updated_at": datetime.now(timezone.utc),
            "last_seen": datetime.now(timezone.utc),
        }

        if existing:
            await db.users.update_one({"_id": existing["_id"]}, {"$set": admin_data})
            print(f"User admin diperbarui: {existing['_id']}")
        else:
            admin_data["created_at"] = datetime.now(timezone.utc)
            result = await db.users.insert_one(admin_data)
            print(f"User admin dibuat: {result.inserted_id}")

        identifier = phone or email
        print(f"\n Detail Admin:")
        print(f"   Identifier : {identifier}")
        print(f"   Role       : admin")
        print(f"\n Login menggunakan OTP ke {identifier}")
        print(f"   Kode OTP dev (hardcode): 123456")

    finally:
        client.close()

async def list_admins() -> None:
    """Tampilkan daftar semua admin."""
    client = AsyncIOMotorClient(MONGODB_URL)
    db = client[DB_NAME]
    try:
        admins = await db.users.find({"role": "admin"}).to_list(length=100)
        if not admins:
            print("Belum ada admin terdaftar.")
            return
        print(f"\n Daftar Admin ({len(admins)}):")
        print("-" * 50)
        for a in admins:
            print(f"  ID       : {a['_id']}")
            print(f"  Nama     : {a.get('display_name')}")
            print(f"  Phone    : {a.get('phone', '-')}")
            print(f"  Email    : {a.get('email', '-')}")
            print(f"  Aktif    : {a.get('is_active')}")
            print("-" * 50)
    finally:
        client.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Manajemen user admin ChatKu")
    parser.add_argument("--phone", help="Nomor telepon admin (contoh: 081234567890)")
    parser.add_argument("--email", help="Email admin (contoh: admin@chatku.id)")
    parser.add_argument("--list", action="store_true", help="Tampilkan daftar admin")

    args = parser.parse_args()

    if args.list:
        asyncio.run(list_admins())
    else:
        asyncio.run(create_admin(phone=args.phone, email=args.email))