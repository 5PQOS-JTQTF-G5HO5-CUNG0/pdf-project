import sys
from pathlib import Path
import pytest

backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.utils.security import sanitize_filename, validate_file, SecurityValidationError

def test_sanitize_filename():
    assert sanitize_filename("../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\windows\\system32\\cmd.exe") == "cmd.exe"
    assert sanitize_filename("normal_file.pdf") == "normal_file.pdf"
    assert sanitize_filename("中文文件名 2024.docx") == "中文文件名 2024.docx"
    assert sanitize_filename("   ") == "unnamed_file"

def test_validate_file_size_limit():
    content = b"x" * 1024 * 1024 # 1MB
    with pytest.raises(SecurityValidationError) as exc:
        validate_file("big.pdf", content, max_size_bytes=500 * 1024) # 限制 500KB
    assert exc.value.error_code == "FILE_TOO_LARGE"

def test_validate_file_extension():
    content = b"plain text"
    with pytest.raises(SecurityValidationError) as exc:
        validate_file("malicious.exe", content, max_size_bytes=10 * 1024 * 1024)
    assert exc.value.error_code == "INVALID_EXTENSION"

def test_validate_magic_bytes():
    # 伪装成 PDF 实际是普通文本
    fake_pdf = b"Hello, I am pretending to be a PDF"
    with pytest.raises(SecurityValidationError) as exc:
        validate_file("fake.pdf", fake_pdf, max_size_bytes=10 * 1024 * 1024)
    assert exc.value.error_code == "MAGIC_BYTES_MISMATCH"

    # 正确的 PDF 签名
    real_pdf = b"%PDF-1.4 real pdf content"
    name, ext = validate_file("valid.pdf", real_pdf, max_size_bytes=10 * 1024 * 1024)
    assert ext == ".pdf"
    assert name == "valid.pdf"
