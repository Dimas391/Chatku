# ChatKu Backend API 🚀

Backend untuk aplikasi chat real-time **ChatKu** dibangun dengan Python + FastAPI.

## 🛠️ Tech Stack

| Komponen | Teknologi |
|----------|-----------|
| Framework | FastAPI + Uvicorn |
| Database | MongoDB Atlas (Motor async) |
| Cache / Session | Redis |
| Autentikasi | JWT + OTP |
| SMS / WhatsApp | Twilio |
| Email | SendGrid |
| File Storage | AWS S3 |
| Real-time | WebSocket |
| Voice / Video Call | WebRTC Signaling |

---

## 📁 Struktur Proyek

```
chatku-backend/
├── run.py                         ← Jalankan server dari sini
├── requirements.txt
├── .env.example
├── pyproject.toml
│
├── app/
│   ├── main.py                    ← Entry point FastAPI
│   ├── core/
│   │   ├── config.py              ← Semua env variables
│   │   ├── database.py            ← Koneksi MongoDB Atlas
│   │   ├── security.py            ← JWT, bcrypt, OTP generator
│   │   └── redis_client.py        ← Cache, OTP, online status
│   ├── models/
│   │   ├── user.py / chat.py / call.py / group.py / notification.py
│   ├── services/
│   │   ├── auth_service.py        ← Kirim/verifikasi OTP, login
│   │   ├── chat_service.py        ← Kirim & ambil pesan
│   │   ├── call_service.py        ← Voice/video call + riwayat
│   │   ├── group_service.py       ← Manajemen grup
│   │   ├── user_service.py        ← Profil, cari user
│   │   ├── notification_service.py← SMS/WhatsApp/Email/Push
│   │   ├── media_service.py       ← Upload file ke S3
│   │   └── websocket_manager.py   ← Koneksi WS + WebRTC signaling
│   ├── api/routes/
│   │   ├── auth.py / users.py / chat.py / groups.py
│   │   ├── calls.py / notifications.py / media.py / websocket.py
│   ├── middleware/
│   │   ├── auth.py                ← JWT dependency
│   │   ├── rate_limit.py          ← Anti-abuse OTP
│   │   └── logging.py             ← Log request/response
│   └── utils/
│       ├── db_indexes.py / helpers.py / exceptions.py / response.py
│
├── tests/
│   ├── test_auth.py / test_security.py / test_helpers.py
│   ├── test_chat_service.py / test_call_service.py
│   └── test_websocket_manager.py
│
└── scripts/
    ├── seed_data.py               ← Isi database data dummy
    ├── create_admin.py            ← Buat admin via CLI
    └── mongo-init.js
```

---

## 🚀 Cara Menjalankan

### 1. Setup Environment

```bash
cd chatku-backend
cp .env.example .env
# Buka .env dan isi MONGODB_URL & SECRET_KEY minimal
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Jalankan Server

```bash
# Development — auto reload saat file berubah
python run.py

# Production — 4 worker, tanpa reload
python run.py --prod

# Expose ke jaringan lokal (test dari HP)
python run.py --host 0.0.0.0

# Port kustom
python run.py --port 8080
```

Server berjalan di **http://localhost:8000**  
Dokumentasi API: **http://localhost:8000/docs**

### 4. Isi Data Dummy

```bash
python scripts/seed_data.py
```

Membuat 5 user dummy. Login dengan OTP **`123456`**.

### 5. Buat Admin

```bash
python scripts/create_admin.py --phone 081234567890
python scripts/create_admin.py --list   # lihat daftar admin
```

---

## 📡 Endpoint Utama

### Auth
```
POST /api/v1/auth/send-otp      Kirim OTP ke phone/email
POST /api/v1/auth/verify-otp    Verifikasi OTP → dapat token
POST /api/v1/auth/refresh        Refresh token
POST /api/v1/auth/logout
```

### Chat
```
GET    /api/v1/chats                      Daftar chat
POST   /api/v1/chats/personal             Buat personal chat
POST   /api/v1/chats/group                Buat grup
GET    /api/v1/chats/{id}/messages        Ambil pesan
POST   /api/v1/chats/{id}/messages        Kirim pesan
POST   /api/v1/chats/{id}/messages/media  Kirim media
PATCH  /api/v1/chats/{id}/read            Tandai terbaca
```

### Voice & Video Call
```
GET    /api/v1/calls/ice-servers    Konfigurasi STUN/TURN
POST   /api/v1/calls/initiate       Mulai panggilan
POST   /api/v1/calls/{id}/answer    Jawab
POST   /api/v1/calls/{id}/decline   Tolak
POST   /api/v1/calls/{id}/end       Akhiri
POST   /api/v1/calls/{id}/signal    Kirim WebRTC signal (SDP/ICE)
GET    /api/v1/calls/history        Riwayat panggilan
```

### WebSocket
```
ws://localhost:8000/api/v1/ws?token=<access_token>
ws://localhost:8000/api/v1/ws/call/<call_id>?token=<access_token>
```

**Events client → server:**
```json
{ "event": "join_chat",     "data": { "chat_id": "..." } }
{ "event": "send_message",  "data": { "chat_id": "...", "content": "Halo!" } }
{ "event": "typing",        "data": { "chat_id": "...", "is_typing": true } }
{ "event": "webrtc_signal", "data": { "type": "offer", "target_user_id": "...", "sdp": "..." } }
{ "event": "ping" }
```

**Events server → client:**
```json
{ "event": "new_message",         "data": { ... } }
{ "event": "incoming_call",       "call_id": "...", "call_type": "audio" }
{ "event": "webrtc_signal",       "type": "answer", "sdp": "..." }
{ "event": "call_ended",          "duration_seconds": 120 }
{ "event": "user_status_changed", "is_online": true }
```

---

## 🧪 Tests

```bash
pytest tests/ -v
pytest tests/ -v --cov=app --cov-report=html
```

---

## 🔐 Environment Variables Penting

| Variabel | Wajib | Keterangan |
|----------|-------|------------|
| `MONGODB_URL` | ✅ | URL MongoDB Atlas |
| `SECRET_KEY` | ✅ | Secret JWT, buat yang panjang & acak |
| `REDIS_URL` | Disarankan | Untuk OTP & online status |
| `TWILIO_ACCOUNT_SID` | OTP SMS | Dari Twilio Console |
| `TWILIO_AUTH_TOKEN` | OTP SMS | Dari Twilio Console |
| `SENDGRID_API_KEY` | OTP Email | Dari SendGrid |
| `AWS_ACCESS_KEY_ID` | Upload file | Untuk S3 |
| `TURN_SERVER_URL` | Video call | TURN server WebRTC |

> **Development tanpa Twilio/SendGrid:** OTP akan tercetak di log terminal. Gunakan kode `123456` untuk akun dari `seed_data.py`.
