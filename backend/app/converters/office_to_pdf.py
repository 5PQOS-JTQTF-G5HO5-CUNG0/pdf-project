import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
import httpx
from app.config import settings
from app.converters.base import BaseConverter

logger = logging.getLogger("converter.office_to_pdf")

class OfficeToPdfConverter(BaseConverter):
    """通过本地 Gotenberg (LibreOffice) 容器将 Office 文档转换为 PDF"""

    @property
    def source_formats(self) -> List[str]:
        return [".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"]

    @property
    def target_format(self) -> str:
        return "pdf"

    def convert(self, input_path: Path, output_path: Path, options: Optional[Dict[str, Any]] = None) -> Path:
        if not input_path.exists():
            raise FileNotFoundError(f"输入文件不存在: {input_path}")

        gotenberg_endpoint = f"{settings.GOTENBERG_URL.rstrip('/')}/forms/libreoffice/convert"
        timeout_seconds = 180.0 # 应对大文档转换提供充裕时间

        try:
            with open(input_path, "rb") as f:
                files = {"files": (input_path.name, f)}
                # Gotenberg LibreOffice endpoint
                with httpx.Client(timeout=timeout_seconds) as client:
                    response = client.post(gotenberg_endpoint, files=files)

            if response.status_code != 200:
                err_text = response.text[:500]
                logger.error(f"Gotenberg 转换失败 [HTTP {response.status_code}]: {err_text}")
                raise RuntimeError(f"Office 转 PDF 失败 (Gotenberg 返回代码 {response.status_code}): {err_text}")

            output_path.parent.mkdir(parents=True, exist_ok=True)
            with open(output_path, "wb") as out_f:
                out_f.write(response.content)

            return output_path
        except httpx.ConnectError as e:
            logger.error(f"无法连接 Gotenberg 转换服务: {e}")
            raise RuntimeError(f"无法连接本地 Gotenberg 转换服务 ({settings.GOTENBERG_URL})，请确认容器正常运行。")
        except httpx.TimeoutException as e:
            logger.error(f"Gotenberg 转换超时: {e}")
            raise TimeoutError("Office 转 PDF 转换超时，文件过大或结构过于复杂。")
        except Exception as e:
            logger.error(f"Office 转换异常: {str(e)}")
            raise
