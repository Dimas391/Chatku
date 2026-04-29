import asyncio
from app.core.database import Database

async def main():
    await Database.connect()
    db = Database.get_db()
    
    update_doc = {'$set': {'rsa_public_key': ''}}
    await db['users'].update_one({'email': 'dimas_kurniawan009@student.pnl.ac.id'}, update_doc)
    await db['users'].update_one({'email': 'akunbersama15ab@gmail.com'}, update_doc)
    print('Corrupted keys wiped from DB.')
    await Database.disconnect()

asyncio.run(main())
