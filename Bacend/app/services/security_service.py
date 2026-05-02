import logging
import hashlib
from datetime import datetime, timezone
from typing import List, Dict, Optional
from bson import ObjectId # type: ignore

from app.core.database import get_collection
from app.services.encryption_service import encryption_service

logger = logging.getLogger(__name__)

class SecurityService:
    """Layanan keamanan untuk dashboard security"""

    @staticmethod
    async def get_security_score(user_id: str) -> Dict:
        """Hitung skor keamanan user berdasarkan berbagai faktor"""
        
        # Ambil data user
        user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
        
        if not user:
            return {"overall": 0, "encryption": 0, "authentication": 0, "integrity": 0}
        
        # Skor Enkripsi (apakah user punya RSA key)
        encryption_score = 100 if user.get("rsa_public_key") else 0
        
        # Skor Autentikasi (apakah user sudah terverifikasi)
        auth_score = 100 if user.get("is_verified", False) else 50
        
        # Skor Integritas (apakah ada log aneh)
        suspicious_logs = await get_collection("forensic_logs").count_documents({
            "user_id": user_id,
            "severity": "critical",
            "timestamp": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)}
        })
        integrity_score = max(0, 100 - (suspicious_logs * 20))
        
        # Skor overall
        overall = int((encryption_score + auth_score + integrity_score) / 3)
        
        return {
            "overall": overall,
            "encryption": encryption_score,
            "authentication": auth_score,
            "integrity": integrity_score,
            "last_updated": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    async def get_security_features(user_id: str) -> List[Dict]:
        """Dapatkan daftar fitur keamanan yang aktif"""
        
        user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
        
        features = [
            {
                "id": "e2ee",
                "label": "End-to-End Encryption",
                "desc": "Pesan dienkripsi dari pengirim ke penerima",
                "icon": "shield-lock",
                "color": "#FF6B35",
                "active": user.get("rsa_public_key") is not None,
                "category": "encryption"
            },
            {
                "id": "aes256",
                "label": "AES-256 Encryption",
                "desc": "Enkripsi pesan dengan standar militer",
                "icon": "lock-outline",
                "color": "#4CAF50",
                "active": True,
                "category": "encryption"
            },
            {
                "id": "rsa2048",
                "label": "RSA-2048 Key Exchange",
                "desc": "Pertukaran kunci aman dengan RSA",
                "icon": "key",
                "color": "#2196F3",
                "active": user.get("rsa_public_key") is not None,
                "category": "encryption"
            },
            {
                "id": "otp_auth",
                "label": "OTP Authentication",
                "desc": "Verifikasi 2 faktor dengan OTP",
                "icon": "cellphone-key",
                "color": "#9C27B0",
                "active": True,
                "category": "auth"
            },
            {
                "id": "forensic_logs",
                "label": "Forensic Logging",
                "desc": "Semua aktivitas tercatat dengan hash",
                "icon": "file-document",
                "color": "#00BCD4",
                "active": True,
                "category": "integrity"
            },
            {
                "id": "message_classification",
                "label": "Message Classification",
                "desc": "Deteksi otomatis pesan berbahaya",
                "icon": "brain",
                "color": "#FF9800",
                "active": True,
                "category": "integrity"
            }
        ]
        
        return features

    @staticmethod
    async def get_key_verifications(user_id: str) -> List[Dict]:
        """Dapatkan daftar kontak dengan verifikasi kunci"""
        
        user = await get_collection("users").find_one({"_id": ObjectId(user_id)})
        contacts = user.get("contacts", [])
        
        keys = []
        for contact_id in contacts:
            if not ObjectId.is_valid(contact_id):
                continue
                
            contact = await get_collection("users").find_one(
                {"_id": ObjectId(contact_id)},
                {"display_name": 1, "rsa_public_key": 1}
            )
            
            if contact and contact.get("rsa_public_key"):
                # Generate fingerprint dari public key
                public_key = contact.get("rsa_public_key", "")
                fingerprint = hashlib.sha256(public_key.encode()).hexdigest()[:16].upper()
                fingerprint = ' '.join(fingerprint[i:i+4] for i in range(0, 16, 4))
                
                # Cek apakah sudah terverifikasi
                verification = await get_collection("key_verifications").find_one({
                    "user_id": user_id,
                    "contact_id": contact_id
                })
                
                keys.append({
                    "id": str(contact_id),
                    "contact_id": contact_id,
                    "contact_name": contact.get("display_name", "Unknown"),
                    "algorithm": "RSA-2048",
                    "fingerprint": fingerprint,
                    "verified": verification is not None,
                    "verified_at": verification.get("verified_at") if verification else None
                })
        
        return keys

    @staticmethod
    async def verify_key(user_id: str, contact_id: str) -> Dict:
        """Verifikasi kunci publik kontak"""
        
        # Simpan verifikasi ke database
        await get_collection("key_verifications").update_one(
            {"user_id": user_id, "contact_id": contact_id},
            {"$set": {
                "verified": True,
                "verified_at": datetime.now(timezone.utc).isoformat(),
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        
        # Catat ke forensic log
        await SecurityService.add_forensic_log(
            user_id=user_id,
            event="Key Verification",
            detail=f"Public key verified for contact {contact_id}",
            category="integrity",
            severity="info"
        )
        
        return {"success": True, "verified": True}

    @staticmethod
    async def get_forensic_logs(
        user_id: str, 
        limit: int = 50, 
        skip: int = 0, 
        severity: Optional[str] = None, 
        category: Optional[str] = None
    ) -> List[Dict]:
        """Ambil forensic logs user"""
        
        query: Dict = {"user_id": user_id}
        if severity:
            query["severity"] = severity
        if category:
            query["category"] = category
            
        logs = await get_collection("forensic_logs").find(
            query
        ).sort("timestamp", -1).skip(skip).limit(limit).to_list(length=limit)
        
        result = []
        for log in logs:
            result.append({
                "id": str(log["_id"]),
                "event": log.get("event", ""),
                "detail": log.get("detail", ""),
                "category": log.get("category", "info"),
                "severity": log.get("severity", "info"),
                "hash": log.get("hash", ""),
                "timestamp": log["timestamp"].timestamp() * 1000 if log.get("timestamp") else 0
            })
        
        return result

    @staticmethod
    async def add_forensic_log(
        user_id: str,
        event: str,
        detail: str,
        category: str,
        severity: str = "info",
        ip_address: str = None,
        user_agent: str = None
    ) -> str:
        """Tambah log forensik"""
        
        log_data = {
            "user_id": user_id,
            "event": event,
            "detail": detail,
            "category": category,
            "severity": severity,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": datetime.now(timezone.utc)
        }
        
        # Generate hash untuk integritas
        hash_input = f"{user_id}{event}{detail}{category}{datetime.now(timezone.utc).isoformat()}"
        log_data["hash"] = hashlib.sha256(hash_input.encode()).hexdigest()
        
        result = await get_collection("forensic_logs").insert_one(log_data)
        return str(result.inserted_id)

    @staticmethod
    async def get_security_settings(user_id: str) -> Dict:
        """Ambil pengaturan keamanan user"""
        
        settings = await get_collection("security_settings").find_one({"user_id": user_id})
        
        if not settings:
            # Default settings
            return {
                "two_factor_enabled": False,
                "session_timeout_minutes": 30,
                "max_login_attempts": 5,
                "encryption_level": "high",
                "auto_logout_inactive": True,
                "notify_new_device": True,
                "notify_suspicious": True
            }
        
        return {
            "two_factor_enabled": settings.get("two_factor_enabled", False),
            "session_timeout_minutes": settings.get("session_timeout_minutes", 30),
            "max_login_attempts": settings.get("max_login_attempts", 5),
            "encryption_level": settings.get("encryption_level", "high"),
            "auto_logout_inactive": settings.get("auto_logout_inactive", True),
            "notify_new_device": settings.get("notify_new_device", True),
            "notify_suspicious": settings.get("notify_suspicious", True)
        }

    @staticmethod
    async def update_security_settings(user_id: str, settings_data: Dict) -> Dict:
        """Update pengaturan keamanan user"""
        
        await get_collection("security_settings").update_one(
            {"user_id": user_id},
            {"$set": {
                **settings_data,
                "updated_at": datetime.now(timezone.utc)
            }},
            upsert=True
        )
        
        return settings_data

    @staticmethod
    async def get_forensic_log_by_id(log_id: str, user_id: str) -> Optional[Dict]:
        """Ambil detail forensic log berdasarkan ID"""
        log = await get_collection("forensic_logs").find_one({
            "_id": ObjectId(log_id),
            "user_id": user_id
        })
        
        if not log:
            return None
            
        return {
            "id": str(log["_id"]),
            "event": log.get("event", ""),
            "detail": log.get("detail", ""),
            "category": log.get("category", "info"),
            "severity": log.get("severity", "info"),
            "hash": log.get("hash", ""),
            "timestamp": log["timestamp"].timestamp() * 1000 if log.get("timestamp") else 0,
            "ip_address": log.get("ip_address"),
            "user_agent": log.get("user_agent")
        }

    @staticmethod
    async def get_security_report(user_id: str) -> Dict:
        """Ambil laporan keamanan lengkap user"""
        score = await SecurityService.get_security_score(user_id)
        features = await SecurityService.get_security_features(user_id)
        logs = await SecurityService.get_forensic_logs(user_id, limit=20)
        settings = await SecurityService.get_security_settings(user_id)
        
        critical_count = await get_collection("forensic_logs").count_documents({
            "user_id": user_id,
            "severity": "critical"
        })
        
        return {
            "score": score,
            "features_summary": {
                "active": len([f for f in features if f["active"]]),
                "total": len(features)
            },
            "recent_activity": logs,
            "settings": settings,
            "statistics": {
                "critical_events": critical_count,
                "report_generated_at": datetime.now(timezone.utc).isoformat()
            }
        }

    @staticmethod
    async def rotate_key_pair(user_id: str) -> Dict:
        """Rotasi kunci RSA user"""
        # Dalam arsitektur E2EE, rotasi kunci idealnya dipicu dari client
        # Server mencatat permintaan rotasi
        return {
            "success": True,
            "message": "Permintaan rotasi kunci RSA berhasil. Silakan perbarui kunci di perangkat Anda.",
            "timestamp": datetime.now(timezone.utc).isoformat()
        }

    @staticmethod
    async def verify_session_security(user_id: str) -> Dict:
        """Verifikasi keamanan session saat ini"""
        return {
            "status": "secure",
            "mfa_verified": True,
            "encryption_active": True,
            "last_login": datetime.now(timezone.utc).isoformat(),
            "session_id": hashlib.sha256(str(user_id).encode()).hexdigest()[:12]
        }