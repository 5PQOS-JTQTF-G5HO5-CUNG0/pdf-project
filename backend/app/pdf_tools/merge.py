import logging
from pathlib import Path
from typing import List
import fitz

logger = logging.getLogger("pdf_tools.merge")

def merge_pdfs(input_paths: List[Path], output_path: Path) -> Path:
    """按传入顺序将多个 PDF 文件合并为一个 PDF"""
    if not input_paths or len(input_paths) < 2:
        raise ValueError("合并操作至少需要提供 2 个 PDF 文件。")

    output_doc = fitz.open()
    try:
        for p in input_paths:
            if not p.exists():
                raise FileNotFoundError(f"PDF 文件未找到: {p}")
            with fitz.open(str(p)) as src_doc:
                output_doc.insert_pdf(src_doc)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_doc.save(str(output_path), garbage=4, deflate=True)
        logger.info(f"成功合并 {len(input_paths)} 个 PDF 到: {output_path}")
        return output_path
    finally:
        output_doc.close()
