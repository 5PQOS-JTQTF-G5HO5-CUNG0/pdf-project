import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from pdf2docx import Converter
from app.converters.base import BaseConverter

logger = logging.getLogger("converter.pdf_to_docx")

class PdfToDocxConverter(BaseConverter):
    """基于 pdf2docx 实现高质量对象级 PDF 转 Word (DOCX)"""

    @property
    def source_formats(self) -> List[str]:
        return [".pdf"]

    @property
    def target_format(self) -> str:
        return "docx"

    def convert(self, input_path: Path, output_path: Path, options: Optional[Dict[str, Any]] = None) -> Path:
        if not input_path.exists():
            raise FileNotFoundError(f"输入文件不存在: {input_path}")

        output_path.parent.mkdir(parents=True, exist_ok=True)
        cv = None
        try:
            cv = Converter(str(input_path))
            # 支持传入指定起始/结束页面
            start_page = options.get("start_page", 0) if options else 0
            end_page = options.get("end_page", None) if options else None

            cv.convert(str(output_path), start=start_page, end=end_page)
            logger.info(f"成功将 PDF 转换为 DOCX: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"PDF 转 Word 失败: {str(e)}")
            raise RuntimeError(f"PDF 转 Word 转换失败: {str(e)}")
        finally:
            if cv is not None:
                try:
                    cv.close()
                except Exception:
                    pass
