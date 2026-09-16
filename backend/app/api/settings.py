from fastapi import APIRouter
from app.config import settings
from app.models.schemas import AppSettings

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("", response_model=AppSettings)
async def get_settings():
    return AppSettings(
        default_format="pdf",
        default_dpi=settings.DEFAULT_DPI,
        cleanup_success_hours=settings.CLEANUP_SUCCESS_HOURS,
        cleanup_failed_hours=settings.CLEANUP_FAILED_HOURS,
        max_file_size_mb=settings.MAX_FILE_SIZE_MB
    )

@router.post("", response_model=AppSettings)
async def update_settings(new_settings: AppSettings):
    settings.DEFAULT_DPI = new_settings.default_dpi
    settings.CLEANUP_SUCCESS_HOURS = new_settings.cleanup_success_hours
    settings.CLEANUP_FAILED_HOURS = new_settings.cleanup_failed_hours
    settings.MAX_FILE_SIZE_MB = new_settings.max_file_size_mb
    return new_settings
