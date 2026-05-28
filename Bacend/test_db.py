import asyncio
from motor.motor_asyncio import AsyncIOMotorClient

async def run():
    client = AsyncIOMotorClient('mongodb://localhost:27017')
    db = client['chatku']
    
    # count total messages
    count = await db.messages.count_documents({})
    print("Total Messages:", count)
    
    m = await db.messages.find_one()
    if m:
        print("created_at:", m.get('created_at'), type(m.get('created_at')))
    else:
        print("No messages found")

asyncio.run(run())
