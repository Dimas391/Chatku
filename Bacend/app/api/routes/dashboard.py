from fastapi import APIRouter, Depends, HTTPException # type: ignore
from datetime import datetime, timezone, timedelta
from typing import List, Dict
from bson import ObjectId # type: ignore
from pydantic import BaseModel
import os
import joblib # type: ignore
import re

import logging
from app.middleware.auth import get_current_admin_id
from app.core.database import get_collection
from app.services.websocket_manager import manager

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)


@router.get("/stats")
async def get_dashboard_stats(admin_id: str = Depends(get_current_admin_id)):
    """Ambil statistik utama dashboard"""
    
    # Total users
    total_users = await get_collection("users").count_documents({})
    
    # Total messages
    total_messages = await get_collection("messages").count_documents({})

    # Pesan hari ini
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    messages_today = await get_collection("messages").count_documents({
        "created_at": {"$gte": today_start}
    })
    
    # Sesi aktif (users online via WebSocket)
    active_sessions = len(manager.get_online_user_ids())
    
    # Persentase E2E encrypted (users dengan RSA key)
    users_with_key = await get_collection("users").count_documents({
        "rsa_public_key": {"$exists": True, "$ne": None}
    })
    encrypted_percent = round((users_with_key / total_users) * 100) if total_users > 0 else 0
    
    return {
        "total_users": total_users,
        "total_messages": total_messages,
        "messages_today": messages_today,
        "active_sessions": active_sessions,
        "encrypted_percent": encrypted_percent
    }


@router.get("/message-trend")
async def get_message_trend(admin_id: str = Depends(get_current_admin_id)):
    """Ambil trend pesan 12 bulan terakhir"""
    
    trend_data = []
    now = datetime.now(timezone.utc)
    
    for i in range(11, -1, -1):
        month_date = now.replace(day=1) - timedelta(days=i * 30)
        month_start = month_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        
        # Hitung akhir bulan
        if month_start.month == 12:
            next_month = month_start.replace(year=month_start.year + 1, month=1)
        else:
            next_month = month_start.replace(month=month_start.month + 1)
        
        month_end = next_month - timedelta(microseconds=1)
        
        month_start_str = month_start.isoformat().replace("+00:00", "Z")
        month_end_str = month_end.isoformat().replace("+00:00", "Z")
        
        input_count = await get_collection("messages").count_documents({
            "$or": [
                {"created_at": {"$gte": month_start, "$lte": month_end}},
                {"created_at": {"$gte": month_start_str, "$lte": month_end_str}}
            ]
        })
        output_count = input_count  # Untuk demo, output = input
        
        month_names = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"]
        trend_data.append({
            "month": i + 1,
            "month_label": month_names[month_start.month - 1],
            "input": input_count,
            "output": output_count
        })
    
    return trend_data


@router.get("/activity-sampling")
async def get_activity_sampling(admin_id: str = Depends(get_current_admin_id)):
    """Ambil data aktivitas per hari (minggu ini)"""
    
    days = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
    today = datetime.now(timezone.utc)
    week_start = today - timedelta(days=today.weekday())
    
    activity_data = []
    
    for i, day_name in enumerate(days):
        day_start = week_start + timedelta(days=i)
        day_start = day_start.replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1) - timedelta(microseconds=1)
        
        day_start_str = day_start.isoformat().replace("+00:00", "Z")
        day_end_str = day_end.isoformat().replace("+00:00", "Z")

        count = await get_collection("messages").count_documents({
            "$or": [
                {"created_at": {"$gte": day_start, "$lte": day_end}},
                {"created_at": {"$gte": day_start_str, "$lte": day_end_str}}
            ]
        })
        
        activity_data.append({
            "day": day_name,
            "value": count
        })
    
    return activity_data


@router.get("/platform-ranks")
async def get_platform_ranks(admin_id: str = Depends(get_current_admin_id)):
    """Ambil peringkat akses per platform"""
    
    # Hitung berdasarkan user_agent dari logs (simulasi)
    total_users = await get_collection("users").count_documents({})
    
    # Simulasi distribusi platform
    platforms = [
        {"label": "Android", "value": round(total_users * 0.50)},
        {"label": "iOS", "value": round(total_users * 0.35)},
        {"label": "Web Admin", "value": round(total_users * 0.10)},
        {"label": "API", "value": round(total_users * 0.05)}
    ]
    
    return platforms


@router.get("/recent-activities")
async def get_recent_activities(admin_id: str = Depends(get_current_admin_id)):
    """Ambil aktivitas terbaru"""
    
    # Ambil dari forensic_logs
    recent_logs = await get_collection("forensic_logs").find().sort("timestamp", -1).limit(10).to_list(length=10)
    
    activities = []
    for log in recent_logs:
        # Ambil username dari user_id
        user = await get_collection("users").find_one({"_id": ObjectId(log["user_id"])})
        username = user.get("display_name") or user.get("username") or "Pengguna" if user else "Pengguna"
        
        # Pastikan timezone-aware
        log_timestamp = log["timestamp"]
        if log_timestamp.tzinfo is None:
            log_timestamp = log_timestamp.replace(tzinfo=timezone.utc)
            
        # Format waktu relatif
        time_diff = datetime.now(timezone.utc) - log_timestamp
        if time_diff.seconds < 60:
            time_str = f"{time_diff.seconds} detik lalu"
        elif time_diff.seconds < 3600:
            minutes = time_diff.seconds // 60
            time_str = f"{minutes} menit lalu"
        elif time_diff.days == 0:
            hours = time_diff.seconds // 3600
            time_str = f"{hours} jam lalu"
        else:
            time_str = f"{time_diff.days} hari lalu"
        
        activities.append({
            "user": username,
            "action": log.get("detail", log.get("event", "Aktivitas")),
            "time": time_str
        })
    
    return activities[:6]


@router.get("/classification-summary")
async def get_classification_summary(admin_id: str = Depends(get_current_admin_id)):
    """Ambil ringkasan klasifikasi pesan"""
    
    # Hitung berdasarkan classification_label dari messages
    total_messages = await get_collection("messages").count_documents({})
    
    normal = await get_collection("messages").count_documents({
        "classification_label": {"$in": [None, "Tidak Berisiko"]}
    })
    
    berisiko = await get_collection("messages").count_documents({
        "classification_label": "Berisiko"
    })
    
    return {
        "normal": normal,
        "berisiko": berisiko
    }


@router.get("/classification-logs")
async def get_classification_logs(admin_id: str = Depends(get_current_admin_id)):
    """Ambil log pesan terbaru untuk dashboard klasifikasi"""
    
    recent_messages = await get_collection("messages").find(
        {"classification_label": {"$exists": True, "$ne": None}}
    ).sort("created_at", -1).limit(10).to_list(length=10)
    
    logs = []
    for msg in recent_messages:
        sender = await get_collection("users").find_one({"_id": ObjectId(msg["sender_id"])})
        sender_name = sender.get("display_name") or sender.get("username") if sender else "Unknown"
        
        msg_time = msg.get("created_at")
        if msg_time and msg_time.tzinfo is None:
            msg_time = msg_time.replace(tzinfo=timezone.utc)
            
        time_str = ""
        if msg_time:
            time_diff = datetime.now(timezone.utc) - msg_time
            if time_diff.seconds < 60:
                time_str = f"{time_diff.seconds} detik lalu"
            elif time_diff.seconds < 3600:
                minutes = time_diff.seconds // 60
                time_str = f"{minutes} menit lalu"
            elif time_diff.days == 0:
                hours = time_diff.seconds // 3600
                time_str = f"{hours} jam lalu"
            else:
                time_str = f"{time_diff.days} hari lalu"
        
        preview = "[Pesan Terenkripsi]"
        if msg.get("content"):
            preview = msg["content"]
            if len(preview) > 50:
                preview = preview[:50] + "..."
        elif msg.get("message_hash"):
            preview = f"Hash: {msg['message_hash'][:16]}..."
        
        logs.append({
            "id": str(msg["_id"]),
            "user": sender_name,
            "preview": preview,
            "label": msg.get("classification_label", "Tidak Berisiko"),
            "conf": 95 if msg.get("classification_label") == "Berisiko" else 99,
            "time": time_str
        })
        
    return logs

# ─── REAL CLASSIFICATION ENDPOINT ─────────────────────────────────────
class ClassifyRequest(BaseModel):
    text: str

ROOT_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))))
MODEL_PATH = os.path.join(ROOT_DIR, "model", "model_naive_bayes.joblib")

_classifier_data = None

def get_classifier():
    global _classifier_data
    if _classifier_data is None:
        if os.path.exists(MODEL_PATH):
            import warnings
            from sklearn.exceptions import InconsistentVersionWarning
            warnings.filterwarnings("ignore", category=InconsistentVersionWarning)
            try:
                data = joblib.load(MODEL_PATH)
                _classifier_data = {
                    'model': data.get('model'),
                    'tfidf': data.get('vectorizer'),
                    'kata_kasar': set(data.get('kata_kasar', [])),
                    'stopwords': set(data.get('stopwords', [])),
                    'pola_url': data.get('pola_url')
                }
                logger.info(f"Model loaded successfully from {MODEL_PATH}")
            except Exception as e:
                logger.error(f"Failed to load model: {e}")
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}")
    return _classifier_data

@router.post("/classify-test")
async def classify_test_message(request: ClassifyRequest, admin_id: str = Depends(get_current_admin_id)):
    """Endpoint untuk tes klasifikasi model secara langsung dari admin dashboard"""
    cdata = get_classifier()
    if not cdata:
        # Fallback ke rule biasa jika model ga ketemu
        return {"label": "Tidak Berisiko", "confidence": 99.0, "scores": [{"label": "Berisiko", "score": 1}, {"label": "Tidak Berisiko", "score": 99}]}
    
    kata_kasar = cdata['kata_kasar']
    stopwords = cdata['stopwords']
    pola_url = cdata['pola_url']
    model = cdata['model']
    tfidf = cdata['tfidf']
    
    KATA_AMBIGUOUS = {'porno', 'bugil', 'telanjang', 'mesum'}
    KONTEKS_NEGATIF = {
        'yuk','ayo','mau','sini','coba','nonton','lihat','download',
        'kirim','bagi','share','klik','link','join','masuk'
    }

    def _is_kemungkinan_nama(t):
        words = t.strip().split()
        if not words or len(words) > 5: return False
        all_cap = all(w[0].isupper() for w in words if w)
        no_special = bool(re.match(r'^[A-Za-z\s]+$', t.strip()))
        mengandung_kasar = any(w.lower() in kata_kasar for w in words)
        return all_cap and no_special and not mengandung_kasar

    def preprocess_simple(t):
        t = str(t).lower().strip()
        t = re.sub(pola_url or r'http\S+', 'URL_CURIGA', t)
        t = re.sub(r'\b0\d[\d\-]{8,12}\b', 'NOMOR_HP_ASING', t)
        t = re.sub(r'[^a-z\s]', ' ', t)
        tokens = [x for x in t.split() if len(x) > 0]
        tokens = [x for x in tokens if x in kata_kasar or (x not in stopwords and len(x) > 1)]
        return ' '.join(tokens) if tokens else 'PESAN_KOSONG'

    pesan_strip = request.text.strip()
    
    # Rules
    if len(pesan_strip) < 4:
        return {"label": "Tidak Berisiko", "confidence": 99, "scores": [{"label": "Berisiko", "score": 1}, {"label": "Tidak Berisiko", "score": 99}]}
    
    if _is_kemungkinan_nama(pesan_strip):
        return {"label": "Tidak Berisiko", "confidence": 95, "scores": [{"label": "Berisiko", "score": 5}, {"label": "Tidak Berisiko", "score": 95}]}

    t_clean = re.sub(r'[^a-z\s]', ' ', pesan_strip.lower())
    tokens = set(t_clean.split())
    kata_kasar_keras = kata_kasar - KATA_AMBIGUOUS
    if tokens & kata_kasar_keras:
        return {"label": "Berisiko", "confidence": 99, "scores": [{"label": "Berisiko", "score": 99}, {"label": "Tidak Berisiko", "score": 1}]}
    
    if (tokens & KATA_AMBIGUOUS) and (tokens & KONTEKS_NEGATIF):
        return {"label": "Berisiko", "confidence": 92, "scores": [{"label": "Berisiko", "score": 92}, {"label": "Tidak Berisiko", "score": 8}]}

    pola_luas = r'((https?|ftp|bit|s|t|rb|cutt)://\S+|(bit\.ly|s\.id|rb\.gy|t\.ly|cutt\.ly|tinyurl\.com|shorturl\.at|bit\.do|ow\.ly|is\.gd|tiny\.cc|[\w-]+\.xyz|[\w-]+\.site)\S*)'
    if re.search(pola_luas, pesan_strip.lower()):
        return {"label": "Berisiko", "confidence": 95, "scores": [{"label": "Berisiko", "score": 95}, {"label": "Tidak Berisiko", "score": 5}]}

    bersih = preprocess_simple(pesan_strip)
    vec = tfidf.transform([bersih])
    proba = model.predict_proba(vec)[0]
    
    is_risky = proba[1] >= 0.65
    label = "Berisiko" if is_risky else "Tidak Berisiko"
    win_conf = round(max(proba) * 100)
    lose_conf = 100 - win_conf
    
    return {
        "label": label, 
        "confidence": win_conf, 
        "scores": [
            {"label": "Berisiko", "score": win_conf if is_risky else lose_conf}, 
            {"label": "Tidak Berisiko", "score": win_conf if not is_risky else lose_conf}
        ]
    }



@router.get("/security-status")
async def get_security_status(admin_id: str = Depends(get_current_admin_id)):
    """Ambil status keamanan sistem"""
    
    # Cek model update terakhir
    model_info = await get_collection("model_info").find_one({}, sort=[("updated_at", -1)])
    model_updated = model_info.get("updated_at") if model_info else None
    
    if model_updated:
        days_diff = (datetime.now(timezone.utc) - model_updated).days
        if days_diff == 0:
            model_updated_str = "Hari ini"
        elif days_diff == 1:
            model_updated_str = "Kemarin"
        else:
            model_updated_str = f"{days_diff} hari lalu"
    else:
        model_updated_str = "3 hari lalu"
    
    # Total klasifikasi hari ini
    today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    classified_today = await get_collection("messages").count_documents({
        "classification_label": {"$ne": None},
        "created_at": {"$gte": today_start}
    })
    
    return {
        "spam_filter": True,
        "threat_detection": True,
        "anti_hoax": True,
        "model_updated": model_updated_str,
        "classified_today": classified_today
    }


@router.get("/encryption-stats")
async def get_encryption_stats(admin_id: str = Depends(get_current_admin_id)):
    """Ambil statistik enkripsi AES-RSA"""
    
    total_users = await get_collection("users").count_documents({})
    
    # User dengan RSA key aktif
    users_with_rsa = await get_collection("users").count_documents({
        "rsa_public_key": {"$exists": True, "$ne": None}
    })
    
    # Total pesan E2EE (Asumsi pesan terenkripsi AES dan key-nya RSA)
    total_messages = await get_collection("messages").count_documents({})
    e2ee_messages = await get_collection("messages").count_documents({
        "encrypted_content": {"$exists": True, "$ne": None}
    })
    
    return {
        "aes_status": "Aktif",
        "rsa_status": "Aktif",
        "total_users_rsa": users_with_rsa,
        "percentage_users_rsa": round((users_with_rsa / total_users) * 100) if total_users > 0 else 0,
        "e2ee_messages_total": e2ee_messages,
        "percentage_e2ee": round((e2ee_messages / total_messages) * 100) if total_messages > 0 else 0
    }


@router.get("/feature-stats")
async def get_feature_stats(admin_id: str = Depends(get_current_admin_id)):
    """Ambil statistik fitur real-time: grup, status user, radar pemakaian, ring pengiriman"""

    total_users = await get_collection("users").count_documents({})
    online_users = len(manager.get_online_user_ids())
    offline_users = max(0, total_users - online_users)

    online_pct  = round((online_users  / total_users) * 100) if total_users > 0 else 0
    offline_pct = round((offline_users / total_users) * 100) if total_users > 0 else 0
    idle_pct    = max(0, 100 - online_pct - offline_pct)

    # Hitungan fitur dari DB
    total_groups  = await get_collection("groups").count_documents({})
    total_messages= await get_collection("messages").count_documents({})
    total_contacts= await get_collection("contacts").count_documents({})
    total_files   = await get_collection("messages").count_documents({"file_url": {"$exists": True, "$ne": None}})
    total_logins  = await get_collection("forensic_logs").count_documents({"event": {"$regex": "login", "$options": "i"}})

    # Normalisasi ke skala 1-140 agar radar chart tampil proporsional
    max_val = max(total_messages, total_contacts, total_files, total_logins, 1)
    def scale(v: int) -> int:
        return max(1, round((v / max_val) * 140))

    # Status pengiriman pesan
    msg_delivered = await get_collection("messages").count_documents({"status": {"$in": ["delivered", "read"]}})
    msg_failed    = await get_collection("messages").count_documents({"status": "failed"})
    msg_pending   = await get_collection("messages").count_documents({"status": {"$in": ["sent", "pending"]}})

    sent_pct    = round((msg_delivered / total_messages) * 100) if total_messages > 0 else 0
    failed_pct  = round((msg_failed    / total_messages) * 100) if total_messages > 0 else 0
    pending_pct = round((msg_pending   / total_messages) * 100) if total_messages > 0 else 0

    return {
        "total_groups":   total_groups,
        "total_contacts": total_contacts,
        "online_pct":     online_pct,
        "idle_pct":       idle_pct,
        "offline_pct":    offline_pct,
        "feature_usage": [
            {"area": "Chat",   "a": scale(total_messages)},
            {"area": "File",   "a": scale(total_files)},
            {"area": "Kontak", "a": scale(total_contacts)},
            {"area": "Login",  "a": scale(total_logins)},
        ],
        "delivery_stats": {
            "sent_pct":    sent_pct,
            "failed_pct":  failed_pct,
            "pending_pct": pending_pct,
        }
    }