import os
import uuid
import logging
import mimetypes
from typing import Tuple, Optional
from fastapi import UploadFile # type: ignore
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)

# Batas ukuran file
MAX_IMAGE_SIZE = 10 * 1024 * 1024    # 10 MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024   # 100 MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024    # 50 MB
MAX_FILE_SIZE = 50 * 1024 * 1024     # 50 MB

ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/gif", "image/webp"}
ALLOWED_VIDEO_TYPES = {"video/mp4", "video/quicktime", "video/x-msvideo"}
ALLOWED_AUDIO_TYPES = {"audio/mpeg", "audio/ogg", "audio/wav", "audio/aac", "audio/m4a"}
ALLOWED_DOCUMENT_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


class MediaService:
    """Layanan upload media ke local storage."""

    def __init__(self):
        # Buat folder uploads jika belum ada
        self.base_upload_dir = "uploads"
        self.ensure_upload_directories()

    def ensure_upload_directories(self):
        """Pastikan folder uploads dan subfoldernya ada."""
        folders = ["avatars", "chat", "temp"]
        for folder in folders:
            folder_path = os.path.join(self.base_upload_dir, folder)
            os.makedirs(folder_path, exist_ok=True)

    def get_base_url(self) -> str:
        """Dapatkan base URL dari settings atau default."""
        base_url = getattr(settings, 'BASE_URL', 'http://192.168.1.5:8000')
        return base_url.rstrip('/')

    # ── Upload File ───────────────────────────────────────
    async def upload_media(
        self,
        file: UploadFile,
        folder: str = "chat",
        user_id: str = "unknown",
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """
        Upload file ke local storage.
        Returns: (success, media_url, error_message)
        """
        try:
            # Baca konten file
            content = await file.read()
            content_type = file.content_type or "application/octet-stream"
            file_size = len(content)

            # Validasi
            valid, error = self._validate_file(content, content_type, file_size)
            if not valid:
                return False, None, error

            # Generate nama file unik
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            ext = mimetypes.guess_extension(content_type) or ".bin"
            filename = f"{folder}_{user_id}_{timestamp}_{uuid.uuid4().hex[:8]}{ext}"
            
            # Buat path folder
            upload_dir = os.path.join(self.base_upload_dir, folder)
            os.makedirs(upload_dir, exist_ok=True)
            
            # Path lengkap file
            file_path = os.path.join(upload_dir, filename)
            
            # Simpan file ke disk
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Generate URL untuk akses
            base_url = self.get_base_url()
            url = f"{base_url}/uploads/{folder}/{filename}"
            
            logger.info(f"File terupload ke local: {file_path}")
            logger.info(f"📎 URL: {url}")
            
            return True, url, None

        except Exception as exc:
            logger.error(f"Gagal upload file: {exc}")
            return False, None, str(exc)

    async def upload_avatar(
        self, file: UploadFile, user_id: str
    ) -> Tuple[bool, Optional[str], Optional[str]]:
        """Upload foto profil dengan resize otomatis ke local storage."""
        try:
            content = await file.read()
            content_type = file.content_type or "image/jpeg"
            file_size = len(content)

            # Validasi format
            if content_type not in ALLOWED_IMAGE_TYPES:
                return False, None, "Format gambar tidak didukung"

            if file_size > MAX_IMAGE_SIZE:
                mb = MAX_IMAGE_SIZE // (1024 * 1024)
                return False, None, f"Ukuran file melebihi batas {mb} MB"

            # Resize gambar menggunakan Pillow
            resized_content = self._resize_image(content, max_size=(400, 400))

            # Generate nama file unik
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            filename = f"avatar_{user_id}_{timestamp}_{uuid.uuid4().hex[:8]}.jpg"
            
            # Buat path folder
            upload_dir = os.path.join(self.base_upload_dir, "avatars")
            os.makedirs(upload_dir, exist_ok=True)
            
            # Path lengkap file
            file_path = os.path.join(upload_dir, filename)
            
            # Simpan file ke disk
            with open(file_path, "wb") as f:
                f.write(resized_content)
            
            # Generate URL
            base_url = self.get_base_url()
            url = f"{base_url}/uploads/avatars/{filename}"
            
            logger.info(f"Avatar terupload ke local: {file_path}")
            logger.info(f"Avatar URL: {url}")
            
            return True, url, None

        except Exception as exc:
            logger.error(f"Gagal upload avatar: {exc}")
            return False, None, str(exc)

    async def delete_media(self, url: str) -> bool:
        """Hapus file dari local storage berdasarkan URL."""
        try:
            # Cek apakah placeholder URL
            if "ui-avatars.com" in url or "placeholder" in url:
                return True
            
            # Extract path dari URL
            base_url = self.get_base_url()
            relative_path = url.replace(f"{base_url}/uploads/", "")
            
            file_path = os.path.join(self.base_upload_dir, relative_path)
            
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"File dihapus: {file_path}")
                return True
            else:
                logger.warning(f"File tidak ditemukan: {file_path}")
                return True
                
        except Exception as exc:
            logger.error(f"Gagal hapus file: {exc}")
            return False

    # ── Validasi ──────────────────────────────────────────
    def _validate_file(
        self, content: bytes, content_type: str, size: int
    ) -> Tuple[bool, Optional[str]]:
        """Validasi tipe dan ukuran file."""
        all_allowed = (
            ALLOWED_IMAGE_TYPES
            | ALLOWED_VIDEO_TYPES
            | ALLOWED_AUDIO_TYPES
            | ALLOWED_DOCUMENT_TYPES
        )
        
        if content_type not in all_allowed:
            return False, f"Tipe file tidak diizinkan: {content_type}"

        # Tentukan batas ukuran berdasarkan tipe
        limit = MAX_IMAGE_SIZE
        if content_type in ALLOWED_VIDEO_TYPES:
            limit = MAX_VIDEO_SIZE
        elif content_type in ALLOWED_AUDIO_TYPES:
            limit = MAX_AUDIO_SIZE
        elif content_type in ALLOWED_DOCUMENT_TYPES:
            limit = MAX_FILE_SIZE

        if size > limit:
            mb = limit // (1024 * 1024)
            return False, f"Ukuran file melebihi batas {mb} MB"

        return True, None

    def _resize_image(self, content: bytes, max_size: tuple = (400, 400)) -> bytes:
        """Resize gambar menggunakan Pillow."""
        try:
            from PIL import Image
            import io
            
            img = Image.open(io.BytesIO(content))
            
            # Convert RGBA to RGB jika perlu
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Resize image
            img.thumbnail(max_size, Image.LANCZOS)
            
            # Simpan ke bytes
            output = io.BytesIO()
            img.save(output, format="JPEG", quality=85, optimize=True)
            return output.getvalue()
            
        except Exception as e:
            logger.warning(f"Gagal resize image: {e}")
            return content

    def get_file_info(self, url: str) -> Optional[dict]:
        """Dapatkan informasi file dari URL."""
        try:
            base_url = self.get_base_url()
            relative_path = url.replace(f"{base_url}/uploads/", "")
            file_path = os.path.join(self.base_upload_dir, relative_path)
            
            if os.path.exists(file_path):
                stat = os.stat(file_path)
                return {
                    "path": file_path,
                    "size": stat.st_size,
                    "created": stat.st_ctime,
                    "modified": stat.st_mtime,
                }
        except Exception as e:
            logger.error(f"Gagal get file info: {e}")
        
        return None