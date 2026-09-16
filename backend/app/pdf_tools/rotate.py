import logging
from pathlib import Path
import fitz
from app.pdf_tools.split import parse_page_ranges

logger = logging.getLogger("pdf_tools.rotate")

def rotate_pdf(input_path: Path, output_path: Path, angle: int = 90, pages: str = "all") -> Path:
    """旋转 PDF 页面 (顺时针角度：90, 180, 270)"""
    if angle not in (90, 180, 270):
        raise ValueError("旋转角度必须为 90, 180 或 270 度。")

    if not input_path.exists():
        raise FileNotFoundError(f"PDF 文件未找到: {input_path}")

    with fitz.open(str(input_path)) as doc:
        total_pages = len(doc)
        if total_pages == 0:
            raise ValueError("PDF 无有效页面。")

        if pages.strip().lower() == "all":
            targets = list(range(total_pages))
        else:
            targets = parse_page_ranges(pages, total_pages)

        for idx in targets:
            page = doc[idx]
            page.set_rotation((page.rotation + angle) % 360)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc.save(str(output_path), garbage=4, deflate=True)
        logger.info(f"成功旋转 PDF ({len(targets)} 页) 并输出至: {output_path}")
        return output_path
