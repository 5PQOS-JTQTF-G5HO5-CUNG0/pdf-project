import logging
import re
import zipfile
from pathlib import Path
from typing import List, Set
import fitz

logger = logging.getLogger("pdf_tools.split")

def parse_page_ranges(range_str: str, max_pages: int) -> List[int]:
    """解析页码字符串如 '1, 3-5, 8' 为 0-based 索引列表"""
    pages: Set[int] = set()
    parts = range_str.split(",")
    for part in parts:
        part = part.strip()
        if not part:
            continue
        if "-" in part:
            start_s, end_s = part.split("-", 1)
            start = int(start_s.strip())
            end = int(end_s.strip())
            for p in range(start, end + 1):
                if 1 <= p <= max_pages:
                    pages.add(p - 1)
        else:
            p = int(part)
            if 1 <= p <= max_pages:
                pages.add(p - 1)
    return sorted(list(pages))

def split_pdf(input_path: Path, output_path: Path, page_ranges: str = "each") -> Path:
    """拆分或提取 PDF 页面"""
    if not input_path.exists():
        raise FileNotFoundError(f"PDF 文件未找到: {input_path}")

    with fitz.open(str(input_path)) as src_doc:
        total_pages = len(src_doc)
        if total_pages == 0:
            raise ValueError("PDF 文档无有效页面。")

        output_path.parent.mkdir(parents=True, exist_ok=True)

        if page_ranges.strip().lower() == "each":
            # 拆分为独立单页并打包为 zip
            zip_target = output_path.with_suffix(".zip") if output_path.suffix.lower() != ".zip" else output_path
            with zipfile.ZipFile(zip_target, "w", zipfile.ZIP_DEFLATED) as zf:
                for i in range(total_pages):
                    page_doc = fitz.open()
                    page_doc.insert_pdf(src_doc, from_page=i, to_page=i)
                    pdf_bytes = page_doc.tobytes(garbage=4, deflate=True)
                    page_doc.close()
                    zf.writestr(f"page_{i + 1:03d}.pdf", pdf_bytes)
            logger.info(f"成功将 PDF 按页拆分为 ZIP 包: {zip_target}")
            return zip_target
        else:
            # 提取指定页码范围组合成新 PDF
            selected_indices = parse_page_ranges(page_ranges, total_pages)
            if not selected_indices:
                raise ValueError(f"指定的页码范围无效 (总页数: {total_pages})")

            out_doc = fitz.open()
            for idx in selected_indices:
                out_doc.insert_pdf(src_doc, from_page=idx, to_page=idx)

            pdf_target = output_path.with_suffix(".pdf")
            out_doc.save(str(pdf_target), garbage=4, deflate=True)
            out_doc.close()
            logger.info(f"成功提取指定页面并生成 PDF: {pdf_target}")
            return pdf_target
