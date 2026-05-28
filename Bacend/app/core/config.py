from pydantic_settings import BaseSettings # type: ignore
from typing import List

class Settings(BaseSettings):
    # ── Aplikasi ──────────────────────────────────────────────
    APP_NAME: str = "SafeChat"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200   # 30 hari
    REFRESH_TOKEN_EXPIRE_DAYS: int = 90

    # ── MongoDB Atlas ─────────────────────────────────────────
    MONGODB_URL: str = "mongodb+srv://dimaskurniawan12212_db_user:1wc8jfeO07xBZgNG@cluster0.1s0itv2.mongodb.net/Safe_Chat?retryWrites=true&w=majority&appName=Cluster0"
    MONGODB_DB_NAME: str = "Safe_Chat"

    # ── Redis ─────────────────────────────────────────────────
    REDIS_URL: str = "redis://192.168.1.84:6379/0"

    BASE_URL: str = "http://192.168.1.84:8000"

    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 465
    EMAIL_USER: str = "dimskur98@gmail.com"
    EMAIL_PASSWORD: str = "ouex yhhe acbt zoyo"

    # ── Twilio ────────────────────────────────────────────────
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""

    # ── SendGrid ──────────────────────────────────────────────
    SENDGRID_API_KEY: str = ""
    SENDGRID_FROM_EMAIL: str = "noreply@chatku.id"
    SENDGRID_FROM_NAME: str = "ChatKu"

    # ── Resend (HTTP email API, alternatif SMTP) ───────────────
    RESEND_API_KEY: str = ""

    # ── Dev mode: log OTP ke konsol jika semua email gagal ─────
    DEV_OTP_LOG_ONLY: bool = True

    # ── AWS S3 ────────────────────────────────────────────────
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "ap-southeast-1"
    AWS_S3_BUCKET: str = "chatku-media"

    # ── CORS ──────────────────────────────────────────────────
    ALLOWED_ORIGINS: str = "http://192.168.1.105:3000,http://192.168.1.105:8081"

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]

    # ── WebRTC ────────────────────────────────────────────────
    TURN_SERVER_URL: str = "stun:stun.l.google.com:19302"
    TURN_USERNAME: str = ""
    TURN_PASSWORD: str = ""
    STUN_SERVER_URL: str = "stun:stun.l.google.com:19302"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
