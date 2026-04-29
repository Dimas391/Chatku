"""
migrate_keys.py — Konversi semua PKCS#1 public key di DB ke format SPKI.
Jalankan sekali: python migrate_keys.py
"""
import asyncio, sys
sys.path.insert(0, '.')

async def main():
    from app.core.database import Database
    from app.utils.key_utils import normalize_public_key

    await Database.connect()
    db = Database.get_db()
    users_col = db["users"]

    print("=== Migrasi Public Key PKCS#1 -> SPKI ===\n")

    cursor = users_col.find(
        {"rsa_public_key": {"$regex": "BEGIN RSA PUBLIC KEY"}},
        {"_id": 1, "rsa_public_key": 1, "email": 1}
    )

    converted = 0
    failed = 0

    async for user in cursor:
        uid = str(user["_id"])
        email = user.get("email", "?")
        old_key = user["rsa_public_key"]

        new_key = normalize_public_key(old_key)

        if "BEGIN RSA PUBLIC KEY" in new_key:
            print(f"  [FAIL] {uid} ({email})")
            failed += 1
        else:
            await users_col.update_one(
                {"_id": user["_id"]},
                {"$set": {"rsa_public_key": new_key}}
            )
            print(f"  [OK]   {uid} ({email})")
            converted += 1

    await Database.disconnect()
    print(f"\nSelesai: {converted} berhasil, {failed} gagal.")

asyncio.run(main())
