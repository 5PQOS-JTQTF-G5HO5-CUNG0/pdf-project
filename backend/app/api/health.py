import httpx
from fastapi import APIRouter
from app.config import settings

router = APIRouter(tags=["Health"])

@router.get("/health")
async def health_check():
    gotenberg_status = "unknown"
    try:
        async with httpx.AsyncClient(timeout=2.0) as client:
            res = await client.get(f"{settings.GOTENBERG_URL.rstrip('/')}/health")
            if res.status_code == 200:
                gotenberg_status = "connected"
            else:
                gotenberg_status = f"http_{res.status_code}"
    except Exception:
        gotenberg_status = "unreachable"

    return {
        "status": "ok",
        "service": "LocalPDF Backend",
        "gotenberg": gotenberg_status,
        "storage": {
            "input_ready": settings.input_dir.exists(),
            "output_ready": settings.output_dir.exists()
        }
    }
