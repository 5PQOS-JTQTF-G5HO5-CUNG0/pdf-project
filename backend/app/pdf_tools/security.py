import logging
from pathlib import Path
import fitz

logger = logging.getLogger("pdf_tools.security")

def encrypt_pdf(input_path: Path, output_path: Path, user_password: str) -> Path:
    """为 PDF 文档添加密码加密保护 (AES-256)"""
    if not input_path.exists():
        raise FileNotFoundError(f"PDF 文件未找到: {input_path}")
    if not user_password:
        raise ValueError("密码不能为空。")

    with fitz.open(str(input_path)) as doc:
        if doc.is_encrypted:
            raise ValueError("该 PDF 已经加密，无需重复加密。")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        # 采用 AES-256 加密级别 (fitz.PDF_ENCRYPT_AES_256)
        doc.save(
            str(output_path),
            encryption=fitz.PDF_ENCRYPT_AES_256,
            user_pw=user_password,
            owner_pw=user_password + "_owner",
            garbage=4,
            deflate=True
        )
        logger.info(f"成功加密 PDF: {output_path}")
        return output_path

def decrypt_pdf(input_path: Path, output_path: Path, password: str) -> Path:
    """使用提供密码解密 PDF 文档"""
    if not input_path.exists():
        raise FileNotFoundError(f"PDF 文件未找到: {input_path}")

    with fitz.open(str(input_path)) as doc:
        if not doc.is_encrypted:
            raise ValueError("该 PDF 未加密，无需解密。")

        auth_success = doc.authenticate(password)
        if not auth_success:
            raise ValueError("解密失败：提供的密码不正确。")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc.save(str(output_path), garbage=4, deflate=True)
        logger.info(f"成功解密 PDF: {output_path}")
        return output_path
