import json
import logging
import uuid
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from app.config import settings
from app.converters.router import conversion_router
from app.models.schemas import ApiResponse, TaskStatus
from app.utils.security import validate_file, SecurityValidationError
from app.utils.task_manager import task_manager

logger = logging.getLogger("api.convert")
router = APIRouter(prefix="/convert", tags=["Convert"])

def run_conversion_task(task_id: str, input_path: Path, target_format: str, options: dict):
    """后台异步转换执行器"""
    try:
        task_manager.set_status(task_id, TaskStatus.PROCESSING, progress=20)

        source_ext = input_path.suffix.lower()
        converter = conversion_router.get_converter(source_ext, target_format)
        if not converter:
            raise ValueError(f"暂不支持从 {source_ext} 转换至 {target_format}")

        task_manager.set_progress(task_id, 40)

        # 准备输出路径
        base_name = input_path.stem
        target_ext = f".{target_format.lower().lstrip('.')}"
        output_dir = settings.output_dir / task_id
        output_dir.mkdir(parents=True, exist_ok=True)
        expected_output_path = output_dir / f"{base_name}{target_ext}"

        task_manager.set_progress(task_id, 60)

        # 执行转换
        actual_output_path = converter.convert(input_path, expected_output_path, options)

        task_manager.set_progress(task_id, 90)

        output_filename = actual_output_path.name
        download_url = f"/api/files/{task_id}/{output_filename}"

        task_manager.mark_completed(task_id, output_filename, download_url)
        logger.info(f"任务 {task_id} 转换成功: {output_filename}")
    except Exception as e:
        logger.exception(f"任务 {task_id} 转换异常: {str(e)}")
        # 客户端友好的错误提示，不暴露 traceback
        err_msg = str(e) if isinstance(e, (ValueError, RuntimeError, TimeoutError)) else "转换过程中发生内部错误，请检查文件是否损坏。"
        task_manager.mark_failed(task_id, err_msg)

@router.get("/matrix")
async def get_conversion_matrix():
    """获取系统支持的转换矩阵"""
    return conversion_router.get_all_supported_matrix()

@router.post("", response_model=ApiResponse)
async def create_conversion_task(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    target: str = Form(...),
    options: Optional[str] = Form(None) # JSON 字符串形式的 options
):
    try:
        content_bytes = await file.read()
        safe_filename, ext = validate_file(file.filename or "file", content_bytes, settings.max_file_size_bytes)
    except SecurityValidationError as e:
        return ApiResponse(
            success=False,
            error_code=e.error_code,
            message=e.message
        )
    except Exception as e:
        logger.error(f"文件读取异常: {e}")
        return ApiResponse(
            success=False,
            error_code="UPLOAD_ERROR",
            message="文件上传处理失败"
        )

    # 检查是否有对应的转换器
    converter = conversion_router.get_converter(ext, target)
    if not converter:
        return ApiResponse(
            success=False,
            error_code="UNSUPPORTED_CONVERSION",
            message=f"不支持从 {ext} 转换至目标格式 {target}"
        )

    # 解析 options
    parsed_options = {}
    if options:
        try:
            parsed_options = json.loads(options)
        except Exception:
            parsed_options = {}

    # 生成 task_id 并落盘输入文件
    task_id = str(uuid.uuid4())
    task_input_dir = settings.input_dir / task_id
    task_input_dir.mkdir(parents=True, exist_ok=True)
    input_file_path = task_input_dir / safe_filename

    with open(input_file_path, "wb") as f:
        f.write(content_bytes)

    # 初始化任务
    task_manager.create_task(task_id, safe_filename, target)

    # 加入异步后台任务队列
    background_tasks.add_task(run_conversion_task, task_id, input_file_path, target, parsed_options)

    return ApiResponse(
        success=True,
        task_id=task_id,
        filename=safe_filename,
        message="转换任务已提交并正在处理中"
    )
