import json
import logging
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks
from app.config import settings
from app.models.schemas import ApiResponse, TaskStatus
from app.utils.security import validate_file, SecurityValidationError
from app.utils.task_manager import task_manager
from app.pdf_tools.merge import merge_pdfs
from app.pdf_tools.split import split_pdf
from app.pdf_tools.rotate import rotate_pdf
from app.pdf_tools.compress import compress_pdf
from app.pdf_tools.security import encrypt_pdf, decrypt_pdf
from app.pdf_tools.watermark import add_watermark
from app.pdf_tools.remove_watermark import remove_watermark
from app.ocr.searchable_pdf import create_searchable_pdf
from app.ocr.ocr_to_doc import ocr_to_docx, ocr_extract_text

logger = logging.getLogger("api.pdf_tools")
router = APIRouter(prefix="/pdf-tools", tags=["PDF Tools"])

def run_pdf_tool_task(task_id: str, action: str, input_paths: List[Path], options: dict):
    """PDF 专用工具异步执行器"""
    try:
        task_manager.set_status(task_id, TaskStatus.PROCESSING, progress=25)
        output_dir = settings.output_dir / task_id
        output_dir.mkdir(parents=True, exist_ok=True)

        primary_input = input_paths[0]
        base_name = primary_input.stem

        task_manager.set_progress(task_id, 50)

        actual_output_path: Path
        if action == "merge":
            out_file = output_dir / f"merged_{base_name}.pdf"
            actual_output_path = merge_pdfs(input_paths, out_file)
        elif action == "split":
            ranges = options.get("page_ranges", "each")
            ext = ".zip" if ranges.strip().lower() == "each" else ".pdf"
            out_file = output_dir / f"{base_name}_split{ext}"
            actual_output_path = split_pdf(primary_input, out_file, ranges)
        elif action == "rotate":
            angle = int(options.get("angle", 90))
            pages = str(options.get("pages", "all"))
            out_file = output_dir / f"{base_name}_rotated_{angle}.pdf"
            actual_output_path = rotate_pdf(primary_input, out_file, angle, pages)
        elif action == "compress":
            level = options.get("level", "medium")
            out_file = output_dir / f"{base_name}_compressed.pdf"
            actual_output_path = compress_pdf(primary_input, out_file, level)
        elif action == "encrypt":
            password = options.get("password", "")
            out_file = output_dir / f"{base_name}_encrypted.pdf"
            actual_output_path = encrypt_pdf(primary_input, out_file, password)
        elif action == "decrypt":
            password = options.get("password", "")
            out_file = output_dir / f"{base_name}_decrypted.pdf"
            actual_output_path = decrypt_pdf(primary_input, out_file, password)
        elif action == "watermark":
            text = options.get("text", "CONFIDENTIAL")
            font_size = int(options.get("font_size", 36))
            opacity = float(options.get("opacity", 0.3))
            rotation = int(options.get("rotation", 45))
            color = options.get("color", "#888888")
            out_file = output_dir / f"{base_name}_watermarked.pdf"
            actual_output_path = add_watermark(primary_input, out_file, text, font_size, opacity, rotation, color)
        elif action in ("remove_watermark", "remove-watermark", "unwatermark"):
            mode = options.get("mode", "text")
            keywords = options.get("keywords") or options.get("text", "")
            case_sensitive = bool(options.get("case_sensitive", False))
            fill_mode = options.get("fill_mode", "none")
            clean_artifacts = bool(options.get("clean_artifacts", True))
            clean_image_watermark = bool(options.get("clean_image_watermark", False))
            area_type = options.get("area_type")
            area_ratio = float(options.get("area_ratio", 0.08))
            out_file = output_dir / f"{base_name}_cleaned.pdf"
            actual_output_path = remove_watermark(
                primary_input,
                out_file,
                mode=mode,
                keywords=keywords,
                case_sensitive=case_sensitive,
                fill_mode=fill_mode,
                clean_artifacts=clean_artifacts,
                clean_image_watermark=clean_image_watermark,
                area_type=area_type,
                area_ratio=area_ratio
            )
        elif action == "searchable":
            out_file = output_dir / f"{base_name}_searchable.pdf"
            actual_output_path = create_searchable_pdf(primary_input, out_file)
        elif action == "ocr":
            out_fmt = options.get("format", "docx").lower()
            if out_fmt == "docx":
                out_file = output_dir / f"{base_name}_ocr.docx"
                actual_output_path = ocr_to_docx(primary_input, out_file)
            else:
                out_file = output_dir / f"{base_name}_ocr.txt"
                text_content = ocr_extract_text(primary_input)
                with open(out_file, "w", encoding="utf-8") as f:
                    f.write(text_content)
                actual_output_path = out_file
        else:
            raise ValueError(f"未知的 PDF 工具动作: {action}")

        task_manager.set_progress(task_id, 90)

        output_filename = actual_output_path.name
        download_url = f"/api/files/{task_id}/{output_filename}"
        task_manager.mark_completed(task_id, output_filename, download_url)
        logger.info(f"PDF 工具任务 {task_id} ({action}) 执行成功: {output_filename}")
    except Exception as e:
        logger.exception(f"PDF 工具任务 {task_id} ({action}) 执行异常: {str(e)}")
        err_msg = str(e) if isinstance(e, ValueError) else f"{action} 处理失败，请检查文件格式或参数。"
        task_manager.mark_failed(task_id, err_msg)

@router.post("/{action}", response_model=ApiResponse)
async def handle_pdf_tool(
    action: str,
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    options: Optional[str] = Form(None)
):
    action = action.lower()
    valid_actions = {
        "merge", "split", "rotate", "compress", "encrypt", "decrypt", "watermark",
        "remove_watermark", "remove-watermark", "unwatermark",
        "searchable", "ocr"
    }
    if action not in valid_actions:
        return ApiResponse(
            success=False,
            error_code="INVALID_ACTION",
            message=f"无效的工具动作: {action}。可用动作: {', '.join(valid_actions)}"
        )

    if action == "merge" and len(files) < 2:
        return ApiResponse(
            success=False,
            error_code="INSUFFICIENT_FILES",
            message="合并 PDF 至少需要上传 2 个文件。"
        )

    task_id = str(uuid.uuid4())
    task_input_dir = settings.input_dir / task_id
    task_input_dir.mkdir(parents=True, exist_ok=True)

    input_paths: List[Path] = []

    for upload_file in files:
        try:
            content_bytes = await upload_file.read()
            safe_name, ext = validate_file(upload_file.filename or "doc.pdf", content_bytes, settings.max_file_size_bytes)
            # OCR 与双层 PDF 支持 PDF 和常见图片，其余纯 PDF 工具仅支持 PDF
            if action in ("ocr", "searchable"):
                allowed = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
                if ext not in allowed:
                    return ApiResponse(
                        success=False,
                        error_code="UNSUPPORTED_FORMAT",
                        message=f"该功能仅支持 PDF 与图片格式 (JPG/PNG/WEBP)，检测到非法格式: {safe_name}"
                    )
            else:
                if ext != ".pdf":
                    return ApiResponse(
                        success=False,
                        error_code="ONLY_PDF_ALLOWED",
                        message=f"PDF 工具仅支持 PDF 文件，检测到非法格式: {safe_name}"
                    )
            target_path = task_input_dir / safe_name
            with open(target_path, "wb") as f:
                f.write(content_bytes)
            input_paths.append(target_path)
        except SecurityValidationError as e:
            return ApiResponse(success=False, error_code=e.error_code, message=e.message)
        except Exception as e:
            logger.error(f"读取 PDF 文件失败: {e}")
            return ApiResponse(success=False, error_code="FILE_READ_ERROR", message="读取上传文件失败")

    parsed_options = {}
    if options:
        try:
            parsed_options = json.loads(options)
        except Exception:
            parsed_options = {}

    task_manager.create_task(task_id, input_paths[0].name, f"pdf-tool-{action}")
    background_tasks.add_task(run_pdf_tool_task, task_id, action, input_paths, parsed_options)

    return ApiResponse(
        success=True,
        task_id=task_id,
        filename=input_paths[0].name,
        message=f"PDF {action} 任务已创建并开始处理"
    )
