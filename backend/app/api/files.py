import logging
import os
import urllib.parse
import uuid
import zipfile
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from app.config import settings
from app.models.schemas import BatchDownloadRequest
from app.utils.security import sanitize_filename
from app.utils.task_manager import task_manager

logger = logging.getLogger("api.files")
router = APIRouter(prefix="/files", tags=["Files"])

@router.get("/{task_id}/{filename}")
async def download_file(task_id: str, filename: str):
    # 清理参数，防止路径注入
    safe_task_id = sanitize_filename(task_id)
    safe_filename = sanitize_filename(filename)

    file_path = settings.output_dir / safe_task_id / safe_filename
    if not file_path.exists() or not file_path.is_file():
        # 兼容直出在 output_dir / safe_filename 的情况
        alt_path = settings.output_dir / safe_filename
        if alt_path.exists() and alt_path.is_file():
            file_path = alt_path
        else:
            raise HTTPException(status_code=404, detail="文件不存在或已被自动清理。")

    encoded_filename = urllib.parse.quote(safe_filename)
    return FileResponse(
        path=str(file_path),
        filename=safe_filename,
        media_type="application/octet-stream",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}"}
    )

@router.post("/batch-download")
async def batch_download(request: BatchDownloadRequest):
    if not request.task_ids:
        raise HTTPException(status_code=400, detail="task_ids 不能为空。")

    batch_id = str(uuid.uuid4())[:8]
    zip_filename = f"LocalPDF_batch_{batch_id}.zip"
    zip_path = settings.temp_dir / zip_filename

    found_files = 0
    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for tid in request.task_ids:
            task = task_manager.get_task(tid)
            if not task or not task.output_filename:
                continue

            target_file = settings.output_dir / tid / task.output_filename
            if target_file.exists():
                zf.write(target_file, arcname=task.output_filename)
                found_files += 1

    if found_files == 0:
        if zip_path.exists():
            zip_path.unlink()
        raise HTTPException(status_code=404, detail="所选任务中未找到可下载的文件。")

    return FileResponse(
        path=str(zip_path),
        filename=zip_filename,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={zip_filename}"}
    )
