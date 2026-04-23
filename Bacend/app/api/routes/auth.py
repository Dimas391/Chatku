from fastapi import APIRouter, HTTPException, status, Depends # type: ignore
from pydantic import BaseModel # type: ignore
from typing import Optional

from app.services.auth_service import AuthService
from app.middleware.auth import get_current_user_id

router = APIRouter(prefix="/auth", tags=["Authentication"])

class SendOTPRequest(BaseModel):
    type: str           
    value: str            
    country_code: str = "+62"

    class Config:
        json_schema_extra = {
            "example": {"type": "phone", "value": "081234567890", "country_code": "+62"}
        }


class VerifyOTPRequest(BaseModel):
    type: str
    value: str
    otp_code: str
    country_code: str = "+62"

    class Config:
        json_schema_extra = {
            "example": {"type": "phone", "value": "081234567890", "otp_code": "123456"}
        }


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


# ── Endpoints ─────────────────────────────────────────────
@router.post(
    "/send-otp",
    summary="Kirim Kode OTP",
    description="Kirim OTP 6 digit ke nomor telepon (via WhatsApp/SMS) atau email.",
)
async def send_otp(request: SendOTPRequest):
    if request.type not in ("phone", "email"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tipe harus 'phone' atau 'email'",
        )
    if not request.value.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nomor telepon atau email tidak boleh kosong",
        )

    success, message = await AuthService.send_otp(
        type=request.type,
        value=request.value.strip(),
        country_code=request.country_code,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Gagal mengirim kode verifikasi. Coba lagi.",
        )
    return {"success": True, "message": message}


@router.post(
    "/verify-otp",
    response_model=TokenResponse,
    summary="Verifikasi OTP & Login",
    description="Verifikasi OTP. Jika user belum terdaftar, otomatis dibuat.",
)
async def verify_otp(request: VerifyOTPRequest):
    if len(request.otp_code) != 6 or not request.otp_code.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="OTP harus 6 digit angka",
        )

    success, access_token, refresh_token = await AuthService.verify_otp(
        type=request.type,
        value=request.value.strip(),
        otp_code=request.otp_code,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Kode verifikasi salah atau telah kedaluwarsa",
        )
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post(
    "/refresh",
    response_model=TokenResponse,
    summary="Perbarui Access Token",
)
async def refresh_token(request: RefreshTokenRequest):
    new_access_token = await AuthService.refresh_access_token(request.refresh_token)
    if not new_access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token tidak valid atau telah kedaluwarsa",
        )
    return TokenResponse(
        access_token=new_access_token,
        refresh_token=request.refresh_token,  # refresh token tidak diganti
    )


@router.post(
    "/logout",
    summary="Logout",
    description="Logout dan set status user menjadi offline.",
)
async def logout(user_id: str = Depends(get_current_user_id)):
    await AuthService.logout(user_id)
    return {"success": True, "message": "Berhasil logout"}
