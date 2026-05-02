"""
Script diagnostik: cek format public key user dari API backend.
Jalankan: python check_user_keys.py
"""

import urllib.request
import urllib.error
import json
import sys

BASE_URL = "http://192.168.1.3:8000/api/v1"

# ── Ganti dengan token valid kamu ──────────────────────────────
# Bisa ambil dari log Expo / AsyncStorage / SecureStore
TOKEN = input("Masukkan access_token (dari log Expo): ").strip()

if not TOKEN:
    print("Token kosong, keluar.")
    sys.exit(1)

def api_get(path):
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return json.loads(r.read()), r.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read()), e.code
    except Exception as e:
        return {"error": str(e)}, 0

def check_key_format(label, public_key):
    if not public_key:
        print(f"   {label}: KOSONG / TIDAK ADA")
        return
    first = public_key.strip().split('\n')[0]
    last  = public_key.strip().split('\n')[-1]
    if "BEGIN PUBLIC KEY" in first and "RSA" not in first:
        print(f" {label}: SPKI (BEGIN PUBLIC KEY) — Format benar untuk Android")
    elif "BEGIN RSA PUBLIC KEY" in first:
        print(f"  {label}: PKCS#1 (BEGIN RSA PUBLIC KEY) — Perlu konversi!")
    else:
        print(f"  {label}: Format tidak dikenal → {first}")
    print(f"     Footer: {last}")
    print(f"     Panjang key: {len(public_key)} karakter")

print("\n" + "="*60)
print("1. Cek: /security/server-public-key")
print("="*60)
data, status = api_get("/security/server-public-key")
print(f"   Status HTTP: {status}")
check_key_format("Server Public Key", data.get("public_key"))

print("\n" + "="*60)
print("2. Cek: /users/me  (profil kamu sendiri)")
print("="*60)
me_data, me_status = api_get("/users/me")
print(f"   Status HTTP: {me_status}")
my_id = me_data.get("id", "")
print(f"   User ID saya: {my_id}")
print(f"   Nama: {me_data.get('display_name', '')}")

if my_id:
    print(f"\n   Mengambil public key milik saya ({my_id})...")
    pk_data, pk_status = api_get(f"/users/{my_id}/public-key")
    print(f"   Status HTTP: {pk_status}")
    check_key_format("Public Key SAYA (pengirim)", pk_data.get("public_key"))

print("\n" + "="*60)
print("3. Cek: public key penerima pesan")
print("="*60)
other_id = input("Masukkan user_id PENERIMA (tekan Enter untuk skip): ").strip()
if other_id:
    pk_data, pk_status = api_get(f"/users/{other_id}/public-key")
    print(f"   Status HTTP: {pk_status}")
    check_key_format("Public Key PENERIMA", pk_data.get("public_key"))

print("\nSelesai. Lihat tanda  untuk key yang masih PKCS#1 (bermasalah).")
