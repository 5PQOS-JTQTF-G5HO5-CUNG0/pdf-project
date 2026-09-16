import os
import re
from pathlib import Path
from typing import Tuple

ALLOWED_EXTENSIONS = {
    # Office
    ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
    # PDF
    ".pdf",
    # Images
    ".jpg", ".jpeg", ".png", ".webp"
}

# Magic bytes signature mapping
MAGIC_SIGNATURES = {
    ".pdf": [b"%PDF-"],
    ".docx": [b"PK\x03\x04"],
    ".xlsx": [b"PK\x03\x04"],
    ".pptx": [b"PK\x03\x04"],
    ".doc": [b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"],
    ".xls": [b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"],
    ".ppt": [b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1"],
    ".jpg": [b"\xFF\xD8\xFF"],
    ".jpeg": [b"\xFF\xD8\xFF"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".webp": [b"RIFF"] # WEBP also contains 'WEBP' at offset 8
}

class SecurityValidationError(Exception):
    def __init__(self, message: str, error_code: str = "SECURITY_VALIDATION_ERROR"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)

def sanitize_filename(filename: str) -> str:
    """清理文件名，剔除路径遍历字符和非法字符，防止路径注入"""
    filename = os.path.basename(filename)
    filename = filename.replace("\\", "/").split("/")[-1]
    # 替换特殊控制字符，保留中文、字母、数字、点、下划线、中划线和空格
    filename = re.sub(r'[^\w\s\.\-\u4e00-\u9fa5]', '_', filename)
    filename = filename.strip(". ")
    if not filename:
        return "unnamed_file"
    return filename

def validate_file(filename: str, file_bytes: bytes, max_size_bytes: int) -> Tuple[str, str]:
    """验证文件大小、扩展名白名单和 Magic Bytes 特征"""
    if len(file_bytes) > max_size_bytes:
        max_mb = max_size_bytes // (1024 * 1024)
        raise SecurityValidationError(f"文件大小超出限制 (最大 {max_mb} MB)", "FILE_TOO_LARGE")

    clean_name = sanitize_filename(filename)
    ext = Path(clean_name).suffix.lower()

    if ext not in ALLOWED_EXTENSIONS:
        raise SecurityValidationError(f"不支持的文件格式: {ext}", "INVALID_EXTENSION")

    # 校验 Magic Bytes
    if ext in MAGIC_SIGNATURES:
        signatures = MAGIC_SIGNATURES[ext]
        matched = False
        for sig in signatures:
            if file_bytes.startswith(sig):
                if ext == ".webp":
                    if len(file_bytes) >= 12 and file_bytes[8:12] == b"WEBP":
                        matched = True
                else:
                    matched = True
                break
        if not matched:
            raise SecurityValidationError(f"文件签名不匹配，可能已损坏或格式被伪造: {ext}", "MAGIC_BYTES_MISMATCH")

    return clean_name, ext
