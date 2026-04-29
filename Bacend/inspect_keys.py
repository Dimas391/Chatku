"""
Cek format key langsung di MongoDB.
"""
import asyncio, sys
sys.path.insert(0, '.')

async def main():
    from app.core.database import Database
    await Database.connect()
    db = Database.get_db()
    users_col = db["users"]

    # Cari semua user yang punya rsa_public_key
    cursor = users_col.find(
        {"rsa_public_key": {"$exists": True, "$ne": None}},
        {"_id": 1, "email": 1, "rsa_public_key": 1}
    ).limit(5)

    async for user in cursor:
        pk = user.get("rsa_public_key", "")
        first50 = pk[:60].replace("\n", "\\n") if pk else "(kosong)"
        print(f"User: {user['_id']}")
        print(f"  email: {user.get('email', '?')}")
        print(f"  key[:60]: {first50}")
        if "BEGIN RSA PUBLIC KEY" in pk:
            print("  FORMAT: PKCS#1 (MASALAH!)")
        elif "BEGIN PUBLIC KEY" in pk:
            print("  FORMAT: SPKI (OK)")
        else:
            print(f"  FORMAT: TIDAK DIKENAL")
        print()

    await Database.disconnect()

asyncio.run(main())
