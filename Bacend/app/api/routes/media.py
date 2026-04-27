from fastapi import APIRouter, Depends, HTTPException, UploadFile, File # type: ignore
from pydantic import BaseModel # type: ignore

from app.middleware.auth import get_current_user_id
from app.services.media_service import MediaService

router = APIRouter(prefix="/media", tags=["Media"])
media_svc = MediaService()

class DeleteMediaRequest(BaseModel):
    url: str


@router.post("/upload", summary="Upload File Media")
async def upload_file(
    file: UploadFile = File(...),
    folder: str = "general",
    user_id: str = Depends(get_current_user_id),
):
    allowed_folders = {"general", "chat", "avatar", "document"}
    if folder not in allowed_folders:
        folder = "general"

    success, url, error = await media_svc.upload_media(
        file=file, folder=folder, user_id=user_id
    )
    if not success:
        raise HTTPException(status_code=400, detail=error or "Upload gagal")

    return {
        "url": url,
        "filename": file.filename,
        "content_type": file.content_type,
        "size": file.size,
    }


@router.delete("", summary="Hapus File Media")
async def delete_file(
    request: DeleteMediaRequest,
    user_id: str = Depends(get_current_user_id),
):
    success = await media_svc.delete_media(request.url)
    if not success:
        raise HTTPException(status_code=400, detail="Gagal menghapus file")
    return {"success": True}
