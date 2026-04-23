# migrate_atlas.py
import asyncio
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
import os

MONGO_URI = "mongodb+srv://dimaskurniawan12212_db_user:1wc8jfeO07xBZgNG@cluster0.1s0itv2.mongodb.net/Safe_Chat?retryWrites=true&w=majority&appName=Cluster0"  # Ganti dengan URI Anda

async def migrate():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client.get_default_database()
    
    # Migrasi messages
    messages = await db.messages.find().to_list(length=None)
    count = 0
    
    for msg in messages:
        created_at = msg.get("created_at")
        if created_at:
            # Jika created_at adalah string atau datetime
            if isinstance(created_at, str):
                original_date = datetime.fromisoformat(created_at.replace('Z', ''))
            else:
                original_date = created_at
            
            # Kurangi 7 jam untuk konversi ke UTC
            utc_date = original_date - timedelta(hours=7)
            
            await db.messages.update_one(
                {"_id": msg["_id"]},
                {"$set": {"created_at": utc_date}}
            )
            count += 1
            print(f"✅ Migrated message {msg['_id']}")
    
    print(f"✅ Total messages migrated: {count}")
    
    # Migrasi chats
    chats = await db.chats.find().to_list(length=None)
    chat_count = 0
    
    for chat in chats:
        last_message_at = chat.get("last_message_at")
        if last_message_at:
            if isinstance(last_message_at, str):
                original_date = datetime.fromisoformat(last_message_at.replace('Z', ''))
            else:
                original_date = last_message_at
            
            utc_date = original_date - timedelta(hours=7)
            
            await db.chats.update_one(
                {"_id": chat["_id"]},
                {"$set": {"last_message_at": utc_date}}
            )
            chat_count += 1
            print(f"✅ Migrated chat {chat['_id']}")
    
    print(f"✅ Total chats migrated: {chat_count}")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate())