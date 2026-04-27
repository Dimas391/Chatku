import logging
from datetime import datetime, timezone
from typing import Optional, Tuple

from bson import ObjectId # type: ignore

from app.core.database import get_collection
from app.core.security import (
    generate_otp,
    create_access_token,
    create_refresh_token,
    decode_token,
)
from app.core.redis_client import set_otp, get_otp, delete_otp
from app.models.user import UserDocument
from app.services.notification_service import NotificationService
from app.services.rsa_service import rsa_service

logger = logging.getLogger(__name__)


class AuthService:
    """Layanan autentikasi pengguna."""

    # ── Registrasi / Kirim OTP ────────────────────────────
    @staticmethod
    async def send_otp(
        type: str,           # "phone" | "email"
        value: str,          # nomor telepon atau email
        country_code: str = "+62",
    ) -> Tuple[bool, str]:
        """
        Kirim OTP ke nomor telepon atau email.
        Returns: (success, message)
        """
        users_col = get_collection("users")

        otp = generate_otp(6)
        key = f"{type}:{value}"

        # Simpan OTP ke Redis (TTL 5 menit)
        saved = await set_otp(key, otp, expire_seconds=300)
        if not saved:
            # Fallback: simpan ke MongoDB sementara jika Redis tidak tersedia
            await get_collection("otp_fallback").update_one(
                {"key": key},
                {
                    "$set": {
                        "otp": otp,
                        "created_at": datetime.now(timezone.utc),
                    }
                },
                upsert=True,
            )

        # Kirim OTP
        notification_svc = NotificationService()
        if type == "phone":
            full_number = f"{country_code}{value.lstrip('0')}"
            success = await notification_svc.send_sms_otp(full_number, otp)
        else:
            success = await notification_svc.send_email_otp(value, otp)

        if not success:
            logger.warning("Gagal kirim OTP ke %s: %s", type, value)
            # Tetap return True agar tidak expose info ke user
        
        logger.info("OTP dikirim ke %s: %s", type, value)
        return True, "Kode verifikasi telah dikirim"

    # ── Verifikasi OTP ────────────────────────────────────
    @staticmethod
    async def verify_otp(
        type: str,
        value: str,
        otp_code: str,
    ) -> Tuple[bool, Optional[str], Optional[str], Optional[str]]:
        """
        Verifikasi OTP dan buat/login user.
        Returns: (success, access_token, refresh_token, public_key)
        """
        key = f"{type}:{value}"

        # Cek OTP di Redis
        stored_otp = await get_otp(key)
        if not stored_otp:
            # Fallback ke MongoDB
            doc = await get_collection("otp_fallback").find_one({"key": key})
            stored_otp = doc["otp"] if doc else None

        if not stored_otp or stored_otp != otp_code:
            return False, None, None, None

        # Hapus OTP setelah berhasil
        await delete_otp(key)
        await get_collection("otp_fallback").delete_one({"key": key})

        # Cari atau buat user
        users_col = get_collection("users")
        query = {"phone": value} if type == "phone" else {"email": value}
        user = await users_col.find_one(query)

        public_key_pem = None

        if not user:
            # 🔐 Generate RSA key pair untuk user baru
            logger.info("🔐 Generating RSA key pair for new user...")
            private_key_pem, public_key_pem = rsa_service.generate_key_pair()
            logger.info("🔐 RSA key pair generated successfully")
            
            # Registrasi user baru
            username = AuthService._generate_username(value)
            new_user = UserDocument(
                username=username,
                display_name=username,
                phone=value if type == "phone" else None,
                email=value if type == "email" else None,
                is_verified=True,
                rsa_public_key=public_key_pem,  # 🔐 Simpan public key di database
            )
            result = await users_col.insert_one(
                new_user.model_dump(by_alias=True, exclude={"id"}, exclude_none=True)
            )
            user_id = str(result.inserted_id)
            logger.info("✅ New user created with ID: %s", user_id)
            
            # 🔐 Untuk sementara, private key akan dikirim ke client di response
            # Di production, private key harus dienkripsi dengan password user
            # Untuk sekarang, kita simpan private key sebagai response tambahan
            # Client harus menyimpan private key dengan aman
            
        else:
            user_id = str(user["_id"])
            # Update is_verified
            await users_col.update_one(
                {"_id": user["_id"]},
                {"$set": {"is_verified": True, "updated_at": datetime.now(timezone.utc)}}
            )
            # Ambil public key yang sudah ada
            public_key_pem = user.get("rsa_public_key")
            logger.info("✅ Existing user logged in: %s", user_id)
            
            if not public_key_pem:
                # Jika user tidak memiliki public key (migrasi dari versi lama)
                logger.warning("⚠️ User %s has no RSA public key, generating new pair...", user_id)
                private_key_pem, public_key_pem = rsa_service.generate_key_pair()
                
                # Update user dengan public key baru
                await users_col.update_one(
                    {"_id": ObjectId(user_id)},
                    {"$set": {"rsa_public_key": public_key_pem}}
                )
                logger.info("🔐 New RSA key pair generated and saved for existing user")

        # Buat tokens
        access_token = create_access_token(subject=user_id)
        refresh_token = create_refresh_token(subject=user_id)

        logger.info("User %s login berhasil.", user_id)
        
        # 🔐 Return public key (dan private key untuk user baru)
        # Untuk user baru, kita perlu mengembalikan private key juga
        # Client harus menyimpannya dengan aman
        return True, access_token, refresh_token, public_key_pem

    # ── Refresh Token ─────────────────────────────────────
    @staticmethod
    async def refresh_access_token(refresh_token: str) -> Optional[str]:
        """Buat access token baru menggunakan refresh token."""
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        users_col = get_collection("users")
        user = await users_col.find_one({"_id": ObjectId(user_id)})
        if not user or not user.get("is_active"):
            return None

        return create_access_token(subject=user_id)

    # ── Logout ────────────────────────────────────────────
    @staticmethod
    async def logout(user_id: str) -> None:
        """Update status user menjadi offline."""
        await get_collection("users").update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "is_online": False,
                    "last_seen": datetime.now(timezone.utc),
                }
            },
        )

    # ── Get User Public Key ───────────────────────────────
    @staticmethod
    async def get_user_public_key(user_id: str) -> Optional[str]:
        """
        Ambil public key RSA user dari database.
        Returns: public_key_pem or None
        """
        try:
            users_col = get_collection("users")
            user = await users_col.find_one({"_id": ObjectId(user_id)})
            if user:
                return user.get("rsa_public_key")
            return None
        except Exception as e:
            logger.error(f"Error getting user public key: {e}")
            return None

    # ── Get My Public Key ─────────────────────────────────
    @staticmethod
    async def get_my_public_key(user_id: str) -> Optional[str]:
        """
        Ambil public key user yang sedang login.
        Returns: public_key_pem or None
        """
        return await AuthService.get_user_public_key(user_id)

    # ── Private helpers ───────────────────────────────────
    @staticmethod
    def _generate_username(value: str) -> str:
        """Generate username dari nomor/email."""
        import re, secrets
        base = re.sub(r"[^a-zA-Z0-9]", "", value.split("@")[0])[:12]
        suffix = secrets.token_hex(3)
        return f"{base}_{suffix}".lower()