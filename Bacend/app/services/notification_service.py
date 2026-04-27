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

    # ── Email OTP via SMTP (Gmail) ─────────────────────────
    async def send_email_otp(self, email: str, otp: str) -> bool:
        """
        Kirim OTP via email menggunakan SMTP Gmail.
        """
        # Cek konfigurasi email
        if not settings.EMAIL_USER or not settings.EMAIL_PASSWORD:
            logger.warning(
                "Email SMTP tidak dikonfigurasi. OTP email (dev): %s untuk %s",
                otp, email
            )
            return True  # Dev mode: anggap berhasil

        try:
            # Buat email
            msg = MIMEMultipart('alternative')
            msg['From'] = f"LockMessageKu <{settings.EMAIL_USER}>"
            msg['To'] = email
            msg['Subject'] = f"[LockMessageKu] Kode Verifikasi: {otp}"

            # HTML content yang menarik
            html_content = f"""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="100%" max-width="500px" cellpadding="0" cellspacing="0" border="0" style="max-width: 500px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                                <!-- Header Gradient -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #FF6B35, #FF8C5A); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
                                        <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 700;">LockMessageKu</h1>
                                        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 16px;">Verifikasi Akun</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <p style="color: #333333; font-size: 16px; line-height: 1.5; margin: 0 0 20px;">Halo,</p>
                                        
                                        <p style="color: #666666; font-size: 16px; line-height: 1.5; margin: 0 0 30px;">
                                            Terima kasih telah mendaftar di LockMessageKu Chat. Gunakan kode verifikasi berikut untuk melanjutkan pendaftaran:
                                        </p>
                                        
                                        <!-- OTP Box -->
                                        <div style="background-color: #fafafa; border: 2px dashed #FF6B35; border-radius: 16px; padding: 30px; text-align: center; margin: 30px 0;">
                                            <span style="font-size: 48px; font-weight: 700; color: #FF6B35; letter-spacing: 12px; font-family: monospace;">
                                                {otp}
                                            </span>
                                        </div>
                                        
                                        <!-- Info -->
                                        <div style="background-color: #fff3e0; border-radius: 12px; padding: 20px; margin: 30px 0;">
                                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                                <tr>
                                                    <td width="40" valign="top" style="padding-right: 12px;">
                                                        <span style="font-size: 24px;">⏱️</span>
                                                    </td>
                                                    <td>
                                                        <p style="color: #666666; font-size: 14px; line-height: 1.5; margin: 0;">
                                                            <strong style="color: #FF6B35;">Kode berlaku selama 5 menit.</strong> Jangan bagikan kode ini kepada siapa pun, termasuk tim LockMessageKu.
                                                        </p>
                                                    </td>
                                                </tr>
                                            </table>
                                        </div>
                                        
                                        <!-- Footer -->
                                        <hr style="border: none; border-top: 1px solid #eeeeee; margin: 30px 0 20px;">
                                        
                                        <p style="color: #999999; font-size: 12px; line-height: 1.5; margin: 0; text-align: center;">
                                            © 2026 LockMessageKu. All rights reserved.<br>
                                            Email ini dikirim secara otomatis, mohon tidak membalas.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
            """

            # Plain text version (fallback)
            text_content = f"""
            LockMessageKu - Verifikasi Akun
            
            Halo,
            
            Terima kasih telah mendaftar di LockMessageKu. Gunakan kode verifikasi berikut untuk melanjutkan pendaftaran:
            
            KODE VERIFIKASI: {otp}
            
            ⏱ Kode berlaku selama 5 menit.
            Jangan bagikan kode ini kepada siapa pun.
            
            © 2026 LockMessageKu
            """

            # Attach parts
            part1 = MIMEText(text_content, 'plain')
            part2 = MIMEText(html_content, 'html')
            
            msg.attach(part1)
            msg.attach(part2)

            # Kirim email via SMTP
            logger.info("Mengirim email OTP ke %s...", email)
            
            # Koneksi ke SMTP server
            if settings.EMAIL_PORT == 587:
                server = smtplib.SMTP(settings.EMAIL_HOST, settings.EMAIL_PORT)
                server.starttls()  # Upgrade ke TLS
            else:
                server = smtplib.SMTP_SSL(settings.EMAIL_HOST, settings.EMAIL_PORT)
            
            server.login(settings.EMAIL_USER, settings.EMAIL_PASSWORD)
            server.send_message(msg)
            server.quit()

            logger.info("Email OTP berhasil dikirim ke %s", email)
            return True

        except smtplib.SMTPAuthenticationError:
            logger.error("Gagal autentikasi SMTP. Periksa EMAIL_USER dan EMAIL_PASSWORD")
            logger.error("   Untuk Gmail, gunakan App Password: https://myaccount.google.com/apppasswords")
            return False
        except smtplib.SMTPException as e:
            logger.error("SMTP Error saat kirim email ke %s: %s", email, e)
            return False
        except Exception as exc:
            logger.error("Gagal kirim email OTP ke %s: %s", email, exc)
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