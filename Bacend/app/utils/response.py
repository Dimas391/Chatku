from typing import Any, Optional, List
from fastapi.responses import JSONResponse # type: ignore

def success_response(data: Any = None, message: str = "Berhasil") -> dict:
    """Format response sukses standar."""
    resp = {"success": True, "message": message}
    if data is not None:
        resp["data"] = data
    return resp

def error_response(message: str, code: int = 400) -> JSONResponse:
    """Format response error standar."""
    return JSONResponse(
        status_code=code,
        content={"success": False, "message": message},
    )
    
def paginated_response(
    items: List[Any],
    total: int,
    skip: int,
    limit: int,
) -> dict:
    """Format response dengan pagination info."""
    return {
        "success": True,
        "data": items,
        "pagination": {
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": (skip + limit) < total,
        },
    }
