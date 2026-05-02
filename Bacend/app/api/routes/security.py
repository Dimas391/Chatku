from fastapi import APIRouter, Depends, HTTPException, status # type: ignore
from typing import Optional, List
from pydantic import BaseModel # type: ignore
from bson import ObjectId # type: ignore
from datetime import datetime, timezone

from app.middleware.auth import get_current_user, get_current_user_id
from app.core.database import get_collection
from app.services.encryption_service import encryption_service
from app.services.classification_service import classification_service
from app.services.security_service import SecurityService

router = APIRouter(prefix="/security", tags=["Security"])


# ── Request Models ─────────────────────────────────────────
class VerifyKeyRequest(BaseModel):
    contact_id: str


class UpdateSecuritySettingsRequest(BaseModel):
    two_factor_enabled: Optional[bool] = None
    session_timeout_minutes: Optional[int] = None
    max_login_attempts: Optional[int] = None
    encryption_level: Optional[str] = None
    auto_logout_inactive: Optional[bool] = None
    notify_new_device: Optional[bool] = None
    notify_suspicious: Optional[bool] = None


# ── Server Public Key (Existing) ───────────────────────────
@router.get("/server-public-key", summary="Ambil Public Key Server")
async def get_server_public_key():
    """
    Ambil public key server untuk enkripsi dual encryption
    """
    try:
        # Gunakan service untuk mendapatkan public key pem yang sudah tersinkronisasi
        public_key = encryption_service.get_public_key_pem()
        
        return {
            "public_key": public_key,
            "algorithm": "RSA-2048",
            "status": "active"
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to load server public key: {str(e)}"
        )


# ── Encryption Status (Existing - Enhanced) ─────────────────
@router.get("/encryption-status", summary="Cek Status Enkripsi")
async def get_encryption_status(
    current_user: dict = Depends(get_current_user),
):
    """
    Cek status enkripsi server dan user
    """
    user_id = str(current_user["_id"])
    
    # Ambil pengaturan keamanan user
    security_settings = await SecurityService.get_security_settings(user_id)
    
    return {
        "enabled": True,
        "algorithm": "AES-256-GCM + RSA-2048",
        "forward_secrecy": True,
        "user_encryption_level": security_settings.get("encryption_level", "standard"),
        "user_has_keypair": bool(current_user.get("rsa_public_key")),
        "last_key_rotation": current_user.get("last_key_rotation"),
        "server_public_key_available": encryption_service.public_key is not None
    }


# ── Security Score ─────────────────────────────────────────
@router.get("/score", summary="Get Security Score")
async def get_security_score(user_id: str = Depends(get_current_user_id)):
    """Ambil skor keamanan user"""
    score = await SecurityService.get_security_score(user_id)
    return score


# ── Security Features ──────────────────────────────────────
@router.get("/features", summary="Get Security Features")
async def get_security_features(user_id: str = Depends(get_current_user_id)):
    """Ambil daftar fitur keamanan yang aktif"""
    features = await SecurityService.get_security_features(user_id)
    return {"features": features}


# ── Key Verifications ──────────────────────────────────────
@router.get("/keys", summary="Get Key Verifications")
async def get_key_verifications(user_id: str = Depends(get_current_user_id)):
    """Ambil daftar kontak dengan verifikasi kunci"""
    keys = await SecurityService.get_key_verifications(user_id)
    return {"keys": keys}


@router.post("/keys/verify", summary="Verify Contact Key")
async def verify_key(
    request: VerifyKeyRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Verifikasi kunci publik kontak"""
    # Validasi contact_id
    if not ObjectId.is_valid(request.contact_id):
        raise HTTPException(status_code=400, detail="ID kontak tidak valid")
    
    result = await SecurityService.verify_key(user_id, request.contact_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Verifikasi gagal"))
    
    return result


# ── Forensic Logs ──────────────────────────────────────────
@router.get("/logs", summary="Get Forensic Logs")
async def get_forensic_logs(
    limit: int = 50,
    skip: int = 0,
    severity: Optional[str] = None,
    category: Optional[str] = None,
    user_id: str = Depends(get_current_user_id)
):
    """
    Ambil forensic logs user dengan filter opsional
    
    - limit: Jumlah maksimal log (default 50)
    - skip: Jumlah log yang dilewati (pagination)
    - severity: Filter berdasarkan severity (info, warning, critical)
    - category: Filter berdasarkan kategori (auth, crypto, network, integrity, access)
    """
    # Validasi limit
    if limit > 200:
        raise HTTPException(status_code=400, detail="Limit maksimal 200")
    
    # Validasi severity jika ada
    if severity and severity not in ["info", "warning", "critical"]:
        raise HTTPException(status_code=400, detail="Severity harus info, warning, atau critical")
    
    # Validasi category jika ada
    if category and category not in ["auth", "crypto", "network", "integrity", "access"]:
        raise HTTPException(status_code=400, detail="Kategori tidak valid")
    
    logs = await SecurityService.get_forensic_logs(
        user_id=user_id,
        limit=limit,
        skip=skip,
        severity=severity,
        category=category
    )
    
    return {
        "logs": logs,
        "total": len(logs),
        "limit": limit,
        "skip": skip
    }


# ── Single Forensic Log Detail ─────────────────────────────
@router.get("/logs/{log_id}", summary="Get Forensic Log Detail")
async def get_forensic_log_detail(
    log_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Ambil detail forensic log berdasarkan ID"""
    if not ObjectId.is_valid(log_id):
        raise HTTPException(status_code=400, detail="ID log tidak valid")
    
    log = await SecurityService.get_forensic_log_by_id(log_id, user_id)
    
    if not log:
        raise HTTPException(status_code=404, detail="Log tidak ditemukan")
    
    return log


# ── Security Settings ──────────────────────────────────────
@router.get("/settings", summary="Get Security Settings")
async def get_security_settings(user_id: str = Depends(get_current_user_id)):
    """Ambil pengaturan keamanan user"""
    settings = await SecurityService.get_security_settings(user_id)
    return settings


@router.put("/settings", summary="Update Security Settings")
async def update_security_settings(
    request: UpdateSecuritySettingsRequest,
    user_id: str = Depends(get_current_user_id)
):
    """Update pengaturan keamanan user"""
    # Filter hanya field yang dikirim
    update_data = {k: v for k, v in request.dict().items() if v is not None}
    
    # Validasi nilai yang diupdate
    if "session_timeout_minutes" in update_data:
        timeout = update_data["session_timeout_minutes"]
        if timeout is not None and (timeout < 5 or timeout > 1440):
            raise HTTPException(
                status_code=400,
                detail="Session timeout harus antara 5-1440 menit"
            )
    
    if "max_login_attempts" in update_data:
        attempts = update_data["max_login_attempts"]
        if attempts is not None and (attempts < 3 or attempts > 10):
            raise HTTPException(
                status_code=400,
                detail="Max login attempts harus antara 3-10"
            )
    
    if "encryption_level" in update_data:
        level = update_data["encryption_level"]
        if level is not None and level not in ["standard", "high", "maximum"]:
            raise HTTPException(
                status_code=400,
                detail="Encryption level harus standard, high, atau maximum"
            )
    
    if update_data:
        # Catat perubahan ke forensic log
        old_settings = await SecurityService.get_security_settings(user_id)
        changed_fields = [k for k in update_data.keys() if old_settings.get(k) != update_data[k]]
        
        if changed_fields:
            await SecurityService.add_forensic_log(
                user_id=user_id,
                event="Security Settings Updated",
                detail=f"Changed fields: {', '.join(changed_fields)}",
                category="auth",
                severity="info"
            )
        
        settings = await SecurityService.update_security_settings(user_id, update_data)
        return {"success": True, "settings": settings, "changed_fields": changed_fields}
    
    return {"success": True, "message": "No changes", "settings": await SecurityService.get_security_settings(user_id)}


# ── Security Report ────────────────────────────────────────
@router.get("/report", summary="Get Security Report")
async def get_security_report(user_id: str = Depends(get_current_user_id)):
    """Ambil laporan keamanan lengkap user"""
    report = await SecurityService.get_security_report(user_id)
    return report


# ── Rotate Key Pair ────────────────────────────────────────
@router.post("/rotate-keys", summary="Rotate RSA Key Pair")
async def rotate_key_pair(current_user: dict = Depends(get_current_user)):
    """
    Rotasi kunci RSA user untuk keamanan jangka panjang.
    Kunci lama akan disimpan di archive untuk dekripsi pesan lama.
    """
    user_id = str(current_user["_id"])
    
    result = await SecurityService.rotate_key_pair(user_id)
    
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message", "Rotasi kunci gagal"))
    
    # Catat ke forensic log
    await SecurityService.add_forensic_log(
        user_id=user_id,
        event="RSA Key Rotated",
        detail="User generated new RSA key pair",
        category="crypto",
        severity="info"
    )
    
    return result


# ── Verify Session ─────────────────────────────────────────
@router.get("/verify-session", summary="Verify Current Session")
async def verify_session(current_user: dict = Depends(get_current_user)):
    """Verifikasi keamanan session saat ini"""
    user_id = str(current_user["_id"])
    
    session_info = await SecurityService.verify_session_security(user_id)
    
    return session_info


# ── Helper Functions (dipanggil dari service lain) ─────────
async def log_security_event(
    user_id: str,
    event: str,
    detail: str,
    category: str,
    severity: str = "info"
) -> dict:
    """
    Helper untuk mencatat event keamanan
    
    Contoh penggunaan:
    await log_security_event(
        user_id="123",
        event="New Device Login",
        detail="Login from new device: iPhone 12",
        category="auth",
        severity="warning"
    )
    """
    # Validasi parameter
    if severity not in ["info", "warning", "critical"]:
        severity = "info"
    
    if category not in ["auth", "crypto", "network", "integrity", "access"]:
        category = "auth"
    
    return await SecurityService.add_forensic_log(
        user_id=user_id,
        event=event,
        detail=detail,
        category=category,
        severity=severity
    )


# ── Bulk Security Status (for dashboard) ───────────────────
@router.get("/dashboard-status", summary="Get Dashboard Security Status")
async def get_dashboard_status(user_id: str = Depends(get_current_user_id)):
    """Ambil status keamanan lengkap untuk dashboard"""
    # Paralel fetch semua data
    score = await SecurityService.get_security_score(user_id)
    features = await SecurityService.get_security_features(user_id)
    keys = await SecurityService.get_key_verifications(user_id)
    logs = await SecurityService.get_forensic_logs(user_id, limit=10)
    settings = await SecurityService.get_security_settings(user_id)
    
    # Hitung statistik
    verified_keys = sum(1 for k in keys if k.get("verified", False))
    unverified_keys = len(keys) - verified_keys
    critical_logs = sum(1 for l in logs if l.get("severity") == "critical")
    warning_logs = sum(1 for l in logs if l.get("severity") == "warning")
    
    return {
        "security_score": score,
        "features": features,
        "key_verifications": {
            "total": len(keys),
            "verified": verified_keys,
            "unverified": unverified_keys,
            "keys": keys[:5]  # 5 keys teratas
        },
        "recent_logs": {
            "total": len(logs),
            "critical": critical_logs,
            "warning": warning_logs,
            "logs": logs
        },
        "settings": settings,
        "recommendations": _generate_security_recommendations(
            score=score,
            verified_keys_count=verified_keys,
            total_keys=len(keys),
            settings=settings
        )
    }


def _generate_security_recommendations(
    score: dict,
    verified_keys_count: int,
    total_keys: int,
    settings: dict
) -> list:
    """Generate rekomendasi keamanan berdasarkan status user"""
    recommendations = []
    
    # Rekomendasi berdasarkan skor
    if score.get("overall", 0) < 60:
        recommendations.append({
            "priority": "high",
            "title": "Skor keamanan rendah",
            "description": "Skor keamanan Anda di bawah 60. Segera tingkatkan pengaturan keamanan.",
            "action": "Periksa dan update pengaturan keamanan"
        })
    
    # Rekomendasi verifikasi kunci
    if total_keys > 0 and verified_keys_count < total_keys:
        unverified = total_keys - verified_keys_count
        recommendations.append({
            "priority": "medium",
            "title": f"{unverified} kontak belum diverifikasi",
            "description": "Verifikasi kunci publik kontak untuk mencegah serangan MITM.",
            "action": "Verifikasi kontak yang belum diverifikasi"
        })
    
    # Rekomendasi 2FA
    if not settings.get("two_factor_enabled", False):
        recommendations.append({
            "priority": "high",
            "title": "Aktifkan Two-Factor Authentication",
            "description": "2FA menambah lapisan keamanan ekstra untuk akun Anda.",
            "action": "Aktifkan 2FA di pengaturan keamanan"
        })
    
    # Rekomendasi session timeout
    if settings.get("session_timeout_minutes", 30) > 60:
        recommendations.append({
            "priority": "low",
            "title": "Session timeout terlalu lama",
            "description": "Session yang lama meningkatkan risiko jika perangkat hilang.",
            "action": "Setel session timeout maksimal 60 menit"
        })
    
    # Rekomendasi notifikasi
    if not settings.get("notify_suspicious", True):
        recommendations.append({
            "priority": "medium",
            "title": "Aktifkan notifikasi aktivitas mencurigakan",
            "description": "Notifikasi membantu mendeteksi akses tidak sah ke akun Anda.",
            "action": "Aktifkan notifikasi untuk aktivitas mencurigakan"
        })
    
    return recommendations