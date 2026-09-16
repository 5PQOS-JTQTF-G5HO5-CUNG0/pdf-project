import logging
from pathlib import Path
from typing import Optional
import fitz # PyMuPDF
from PIL import Image
import io
from app.ocr.engine import run_ocr_on_image

logger = logging.getLogger("ocr.searchable_pdf")

def create_searchable_pdf(input_path: Path, output_path: Path, dpi: int = 200) -> Path:
    """
    将扫描版 PDF 或图片文件转为双层可搜索 PDF（Invisible Text Layer）
    底层保持原始高保真图像，上层叠加透明文字层，支持划词复制与全文 Ctrl+F 搜索
    """
    if not input_path.exists():
        raise FileNotFoundError(f"输入文件不存在: {input_path}")

    ext = input_path.suffix.lower()

    if ext in (".jpg", ".jpeg", ".png", ".webp"):
        # 输入是图片，先构造单页 PDF
        doc = fitz.open()
        with Image.open(input_path) as img:
            w, h = img.size
        # 换算到 72 点/英寸
        rect = fitz.Rect(0, 0, w * 72 / dpi, h * 72 / dpi)
        page = doc.new_page(width=rect.width, height=rect.height)
        page.insert_image(rect, filename=str(input_path))
    elif ext == ".pdf":
        doc = fitz.open(str(input_path))
    else:
        raise ValueError(f"不支持转为可搜索 PDF 的格式: {ext}")

    try:
        total_pages = len(doc)
        logger.info(f"开始生成双层可搜索 PDF，总计 {total_pages} 页...")

        for page_idx in range(total_pages):
            page = doc[page_idx]
            page_rect = page.rect

            # 渲染当前页面为高分辨率图片用于 OCR
            zoom = dpi / 72.0
            mat = fitz.Matrix(zoom, zoom)
            pix = page.get_pixmap(matrix=mat)
            img_bytes = pix.tobytes("png")

            # OCR 文本提取
            ocr_results = run_ocr_on_image(img_bytes)

            # 在 PDF 页面中叠加不可见文字（render_mode=3）
            for item in ocr_results:
                text = item["text"].strip()
                if not text:
                    continue

                box = item["box"]
                # box: [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] (相对于渲染位图像素)
                # 转换回 PDF 页面物理坐标
                min_x = min(p[0] for p in box) / zoom
                max_x = max(p[0] for p in box) / zoom
                min_y = min(p[1] for p in box) / zoom
                max_y = max(p[1] for p in box) / zoom

                box_width = max(1.0, max_x - min_x)
                box_height = max(1.0, max_y - min_y)

                # 估算字号
                font_size = max(6.0, min(box_height * 0.85, box_width / max(1, len(text))))

                # 使用 render_mode=3 写入隐藏透明文本
                # 兼容中文字体，fallback china-ss
                try:
                    font = fitz.Font("china-ss")
                    # 使用 TextWriter 或 insert_text
                    insert_pt = fitz.Point(min_x, max_y - (box_height * 0.15))
                    page.insert_text(
                        insert_pt,
                        text,
                        fontsize=font_size,
                        fontname="china-ss",
                        render_mode=3 # 不可见文本（可搜索图层）
                    )
                except Exception as ex:
                    # 部分环境若内置字体受限，fallback 默认
                    try:
                        page.insert_text(
                            fitz.Point(min_x, max_y),
                            text,
                            fontsize=font_size,
                            render_mode=3
                        )
                    except Exception:
                        pass

        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc.save(str(output_path), garbage=4, deflate=True)
        logger.info(f"双层可搜索 PDF 生成成功: {output_path}")
        return output_path
    finally:
        doc.close()
