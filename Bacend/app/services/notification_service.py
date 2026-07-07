import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

from app.core.config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    """Layanan pengiriman notifikasi ke pengguna."""

    # ── SMS / WhatsApp OTP via Twilio ─────────────────────
    async def send_sms_otp(self, phone_number: str, otp: str) -> bool:
        """
        Kirim OTP via SMS atau WhatsApp menggunakan Twilio.
        Otomatis fallback ke SMS jika WhatsApp gagal.
        """
        if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
            logger.warning("Twilio tidak dikonfigurasi. OTP (dev): %s", otp)
            return True  # Dev mode: anggap berhasil

        try:
            from twilio.rest import Client  # type: ignore
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

            body = f"Kode verifikasi ChatKu Anda: *{otp}*\nBerlaku 5 menit. Jangan bagikan ke siapa pun."

            # Coba WhatsApp dulu
            try:
                msg = client.messages.create(
                    from_=settings.TWILIO_WHATSAPP_NUMBER,
                    to=f"whatsapp:{phone_number}",
                    body=body,
                )
                logger.info("OTP WhatsApp terkirim ke %s: %s", phone_number, msg.sid)
                return True
            except Exception as wa_err:
                logger.warning("WhatsApp gagal, fallback ke SMS: %s", wa_err)

            # Fallback SMS
            msg = client.messages.create(
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number,
                body=body,
            )
            logger.info("OTP SMS terkirim ke %s: %s", phone_number, msg.sid)
            return True

        except Exception as exc:
            logger.error("Gagal kirim OTP SMS ke %s: %s", phone_number, exc)
            return False

    # ── Email OTP (Dev Mode — tanpa SMTP) ──────────────────
    async def send_email_otp(self, email: str, otp: str) -> bool:
        """
        OTP dicetak ke log server (tidak dikirim via SMTP).
        Salin kode dari log backend untuk proses verifikasi.
        """
        logger.warning(
            "\n"
            "╔══════════════════════════════════════════╗\n"
            "║           🔐  KODE OTP VERIFIKASI        ║\n"
            "╠══════════════════════════════════════════╣\n"
            "║  EMAIL  : %-30s  ║\n"
            "║  OTP    : %-30s  ║\n"
            "║  Berlaku: 5 menit                        ║\n"
            "╚══════════════════════════════════════════╝",
            )
        # return True  # Dihapus agar proses lanjut ke SMTP

        # ── Buat pesan email ────────────────────────────────
        msg = MIMEMultipart('alternative')
        msg['From'] = f"LockMessageKu <{settings.EMAIL_USER}>"
        msg['To'] = email
        msg['Subject'] = f"[LockMessageKu] Kode Verifikasi: {otp}"

        html_content = f"""<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; background:#f5f5f5; margin:0; padding:40px 20px;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center">
      <table width="500" cellpadding="0" cellspacing="0" border="0"
             style="background:#fff; border-radius:16px; box-shadow:0 4px 12px rgba(0,0,0,.1); max-width:500px;">
        <tr>
          <td style="background:linear-gradient(135deg,#FF6B35,#FF8C5A); padding:40px 30px;
                     border-radius:16px 16px 0 0; text-align:center;">
            <h1 style="color:#fff; margin:0; font-size:32px;">LockMessageKu</h1>
            <p style="color:rgba(255,255,255,.9); margin:8px 0 0;">Verifikasi Akun</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 30px;">
            <p style="color:#333; font-size:16px;">Halo,</p>
            <p style="color:#666; font-size:16px;">
              Gunakan kode berikut untuk menyelesaikan pendaftaran di LockMessageKu:
            </p>
            <div style="background:#fafafa; border:2px dashed #FF6B35; border-radius:16px;
                        padding:30px; text-align:center; margin:30px 0;">
              <span style="font-size:48px; font-weight:700; color:#FF6B35;
                           letter-spacing:12px; font-family:monospace;">{otp}</span>
            </div>
            <p style="color:#888; font-size:13px;">
              ⏱ Kode berlaku <strong>5 menit</strong>. Jangan bagikan kode ini kepada siapapun.
            </p>
            <hr style="border:none; border-top:1px solid #eee; margin:30px 0 20px;">
            <p style="color:#999; font-size:12px; text-align:center;">
              © 2026 LockMessageKu. Email ini dikirim otomatis, mohon tidak membalas.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

        text_content = (
            f"LockMessageKu - Verifikasi Akun\n\n"
            f"KODE VERIFIKASI: {otp}\n\n"
            f"Kode berlaku 5 menit. Jangan bagikan ke siapapun.\n\n"
            f"© 2026 LockMessageKu"
        )
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))

        # ── Fungsi kirim dengan pilihan SSL/TLS ─────────────
        def _try_send(use_ssl: bool, port: int) -> bool:
            try:
                if use_ssl:
                    srv = smtplib.SMTP_SSL(settings.EMAIL_HOST, port, timeout=15)
                else:
                    srv = smtplib.SMTP(settings.EMAIL_HOST, port, timeout=15)
                    srv.ehlo()
                    srv.starttls()
                    srv.ehlo()
                srv.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
                srv.send_message(msg)
                srv.quit()
                return True
            except Exception as exc:
                logger.warning("[SMTP] Gagal (ssl=%s port=%s): %s", use_ssl, port, exc)
                return False

        # ── Percobaan 1: STARTTLS port 587 ──────────────────
        if _try_send(use_ssl=False, port=587):
            logger.info("[SMTP] OTP terkirim via STARTTLS ke %s", email)
            return True

        # ── Percobaan 2: SSL port 465 ───────────────────────
        if _try_send(use_ssl=True, port=465):
            logger.info("[SMTP] OTP terkirim via SSL ke %s", email)
            return True

        # ── Fallback DEV: log OTP ke console ────────────────
        if getattr(settings, 'DEV_OTP_LOG_ONLY', True):
            logger.warning(
                "======================================================\n"
                "  [DEV MODE] SMTP tidak tersedia (port diblokir)\n"
                "  EMAIL : %s\n"
                "  OTP   : %s\n"
                "  Salin kode ini untuk login/registrasi.\n"
                "======================================================",
                email, otp
            )
            return True  # Anggap sukses agar flow registrasi tetap berjalan

        logger.error("[SMTP] Semua percobaan gagal. OTP tidak terkirim ke %s", email)
        return False

    # ── Push Notification (FCM) ───────────────────────────
    async def send_push_notification(
        self,
        device_token: str,
        title: str,
        body: str,
        data: Optional[dict] = None,
    ) -> bool:
        """
        Kirim push notification via Firebase Cloud Messaging.
        """
        try:
            import firebase_admin  # type: ignore
            from firebase_admin import messaging  # type: ignore

            message = messaging.Message(
                notification=messaging.Notification(title=title, body=body),
                data={str(k): str(v) for k, v in (data or {}).items()},
                token=device_token,
                android=messaging.AndroidConfig(
                    notification=messaging.AndroidNotification(
                        color="#FF6B35",
                        sound="default",
                    )
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(sound="default"),
                    )
                ),
            )
            response = messaging.send(message)
            logger.info("Push notification terkirim: %s", response)
            return True

        except ImportError:
            logger.warning("Firebase Admin SDK tidak terpasang.")
            return False
        except Exception as exc:
            logger.error("Gagal kirim push notification: %s", exc)
            return False

    async def send_incoming_call_notification(
        self,
        device_token: str,
        caller_name: str,
        call_type: str,
        call_id: str,
        chat_id: str,
    ) -> bool:
        """Kirim notifikasi panggilan masuk."""
        icon = "📹" if call_type == "video" else "📞"
        return await self.send_push_notification(
            device_token=device_token,
            title=f"{icon} Panggilan {call_type.title()} Masuk",
            body=f"{caller_name} sedang menelepon...",
            data={
                "type": "incoming_call",
                "call_id": call_id,
                "chat_id": chat_id,
                "call_type": call_type,
                "caller_name": caller_name,
            },
        )