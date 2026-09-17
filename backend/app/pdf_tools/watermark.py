import logging
from pathlib import Path
import fitz

logger = logging.getLogger("pdf_tools.watermark")

def hex_to_rgb_tuple(hex_str: str):
    hex_str = hex_str.lstrip("#")
    if len(hex_str) == 3:
        hex_str = "".join([c*2 for c in hex_str])
    if len(hex_str) != 6:
        return (0.5, 0.5, 0.5)
    r = int(hex_str[0:2], 16) / 255.0
    g = int(hex_str[2:4], 16) / 255.0
    b = int(hex_str[4:6], 16) / 255.0
    return (r, g, b)

def add_watermark(
    input_path: Path,
    output_path: Path,
    text: str,
    font_size: int = 36,
    opacity: float = 0.3,
    rotation: int = 45,
    color: str = "#888888"
) -> Path:
    """向 PDF 各页面叠加半透明倾斜文字水印"""
    if not input_path.exists():
        raise FileNotFoundError(f"PDF 文件未找到: {input_path}")
    if not text.strip():
        raise ValueError("水印文字不能为空。")

    rgb_color = hex_to_rgb_tuple(color)

    with fitz.open(str(input_path)) as doc:
        for page in doc:
            rect = page.rect
            center_x = (rect.x0 + rect.x1) / 2
            center_y = (rect.y0 + rect.y1) / 2

            # 在中心及四周绘制平铺或单中心倾斜水印
            # 使用 fitz.Point 和 insert_text (或 TextWriter)
            # PyMuPDF 支持 insert_text 带 morph 旋转和 render_mode
            tw = fitz.TextWriter(rect, opacity=opacity, color=rgb_color)
            font = fitz.Font("china-ss") # 优先采用内置中文字体防止乱码
            
            # 计算文字宽高并居中放置
            text_len = font.text_length(text, fontsize=font_size)
            p = fitz.Point(center_x - text_len / 2, center_y)
            tw.append(p, text, fontsize=font_size, font=font)
            
            # 倾斜变换写入 (morph 必须为 (Point, Matrix) 二元组)
            tw.write_text(page, morph=(fitz.Point(center_x, center_y), fitz.Matrix(rotation)))

        output_path.parent.mkdir(parents=True, exist_ok=True)
        doc.save(str(output_path), garbage=4, deflate=True)
        logger.info(f"成功为 PDF 添加水印: {output_path}")
        return output_path
