from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class TaskStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class ApiResponse(BaseModel):
    success: bool
    task_id: Optional[str] = None
    filename: Optional[str] = None
    download_url: Optional[str] = None
    error_code: Optional[str] = None
    message: Optional[str] = None
    detail: Optional[str] = None

class TaskInfo(BaseModel):
    task_id: str
    status: TaskStatus
    progress: int = Field(default=0, ge=0, le=100)
    source_filename: str
    target_format: str
    output_filename: Optional[str] = None
    download_url: Optional[str] = None
    created_at: float
    finished_at: Optional[float] = None
    error_message: Optional[str] = None

class BatchDownloadRequest(BaseModel):
    task_ids: List[str]

class PdfMergeRequest(BaseModel):
    # order of files will be processed according to task/file upload sequence
    pass

class PdfSplitOptions(BaseModel):
    # e.g., "1,3-5,8" or "each"
    page_ranges: str = "each"

class PdfRotateOptions(BaseModel):
    # 90, 180, 270
    angle: int = 90
    # "all" or specific pages "1,3"
    pages: str = "all"

class PdfCompressOptions(BaseModel):
    # "low", "medium", "high"
    level: str = "medium"

class PdfSecurityOptions(BaseModel):
    password: str
    action: str = "encrypt" # encrypt or decrypt

class PdfWatermarkOptions(BaseModel):
    text: str
    font_size: int = 36
    opacity: float = 0.3
    rotation: int = 45
    color: str = "#888888" # hex color

class AppSettings(BaseModel):
    default_format: str = "pdf"
    default_dpi: int = 300
    cleanup_success_hours: int = 1
    cleanup_failed_hours: int = 24
    max_file_size_mb: int = 500
