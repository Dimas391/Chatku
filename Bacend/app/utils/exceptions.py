from fastapi import HTTPException, status # type: ignore

class ChatKuException(HTTPException):
    """Base exception untuk semua error ChatKu."""
    def __init__(self, status_code: int, detail: str):
        super().__init__(status_code=status_code, detail=detail)


class NotFoundError(ChatKuException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} tidak ditemukan",
        )

class UnauthorizedError(ChatKuException):
    def __init__(self, detail: str = "Tidak terautentikasi"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
        )

class ForbiddenError(ChatKuException):
    def __init__(self, detail: str = "Akses ditolak"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )

class BadRequestError(ChatKuException):
    def __init__(self, detail: str = "Permintaan tidak valid"):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
        )

class ConflictError(ChatKuException):
    def __init__(self, detail: str = "Konflik data"):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
        )

class ServiceUnavailableError(ChatKuException):
    def __init__(self, service: str = "Layanan"):
        super().__init__(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"{service} sedang tidak tersedia. Coba lagi nanti.",
        )

class TooManyRequestsError(ChatKuException):
    def __init__(self, detail: str = "Terlalu banyak permintaan"):
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
        )
