import logging
import zipfile
from pathlib import Path
from typing import Optional, Dict, Any, List
import fitz # PyMuPDF
from app.config import settings
from app.converters.base import BaseConverter

logger = logging.getLogger("converter.pdf_to_image")

class PdfToImageConverter(BaseConverter):
    """基于 PyMuPDF 将 PDF 页面渲染为高清晰度图片 (PNG/JPG/WEBP)"""

    def __init__(self, target_img_format: str = "png"):
        self._target_format = target_img_format.lower().lstrip(".")

    @property
    def source_formats(self) -> List[str]:
        return [".pdf"]

    @property
    def target_format(self) -> str:
        return self._target_format

    def convert(self, input_path: Path, output_path: Path, options: Optional[Dict[str, Any]] = None) -> Path:
        if not input_path.exists():
            raise FileNotFoundError(f"输入文件不存在: {input_path}")

        options = options or {}
        dpi = int(options.get("dpi", settings.DEFAULT_DPI))
        # PyMuPDF 默认基准 DPI 为 72
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)

        doc = None
        try:
            doc = fitz.open(str(input_path))
            total_pages = len(doc)
            if total_pages == 0:
                raise ValueError("PDF 文档无有效页面。")

            ext = f".{self._target_format}"

            # 如果只有单页且输出目标是普通图片扩展名，则直接输出该图片
            if total_pages == 1 and output_path.suffix.lower() == ext:
                page = doc[0]
                pix = page.get_pixmap(matrix=mat, alpha=(self._target_format == "png"))
                output_path.parent.mkdir(parents=True, exist_ok=True)
                pix.save(str(output_path))
                return output_path

            # 多页文件：输出各个页面图片并打包为 zip 压缩包
            zip_target = output_path
            if zip_target.suffix.lower() != ".zip":
                zip_target = output_path.with_suffix(".zip")

            zip_target.parent.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(zip_target, "w", zipfile.ZIP_DEFLATED) as zf:
                for page_num in range(total_pages):
                    page = doc[page_num]
                    pix = page.get_pixmap(matrix=mat, alpha=(self._target_format == "png"))
                    img_filename = f"page_{page_num + 1:03d}{ext}"
                    img_data = pix.tobytes(self._target_format)
                    zf.writestr(img_filename, img_data)

            logger.info(f"成功将 {total_pages} 页 PDF 转换为 {ext} 图片包: {zip_target}")
            return zip_target
        except Exception as e:
            logger.error(f"PDF 转图片失败: {str(e)}")
            raise RuntimeError(f"PDF 转图片失败: {str(e)}")
        finally:
            if doc is not None:
                doc.close()
