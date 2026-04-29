import asyncio, sys
sys.path.insert(0, '.')

async def main():
    from app.services.encryption_service import encryption_service
    from app.core.database import get_collection

    # Cek server public key
    pub = encryption_service.get_public_key_pem()
    lines = pub.strip().split('\n')
    print('=== SERVER PUBLIC KEY ===')
    print('Header baris 1:', lines[0])
    print('Header baris -1:', lines[-1])
    print('Total baris:', len(lines))
    print()

    # Cek public key user dari DB (ambil 3 user yang punya kunci)
    users_col = get_collection('users')
    query = {'rsa_public_key': {'$exists': True, '$ne': None}}
    users = await users_col.find(query).limit(3).to_list(length=3)
    print('=== USER PUBLIC KEYS DI DB ===')
    if not users:
        print('(Tidak ada user dengan rsa_public_key)')
    for u in users:
        pk = u.get('rsa_public_key', '')
        if pk:
            first_line = pk.strip().split('\n')[0]
            last_line  = pk.strip().split('\n')[-1]
        else:
            first_line = '(kosong)'
            last_line  = '(kosong)'
        print(f'User: {u["_id"]} | Header: {first_line} | Footer: {last_line}')

asyncio.run(main())
